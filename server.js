const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET || "change-this-secret-in-production";

const DB_PATH = process.env.DB_PATH || (process.env.RENDER ? "/var/data/data.db" : "data.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  expires_at INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);
`);

const adminUser = process.env.ADMIN_USERNAME || "admin";
const adminPass = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const existing = db.prepare("SELECT id FROM users WHERE username=?").get(adminUser);
if (!existing) {
  db.prepare("INSERT INTO users(username,password_hash,expires_at,active,created_at) VALUES(?,?,?,?,?)")
    .run(adminUser, bcrypt.hashSync(adminPass, 12), null, 1, Date.now());
  console.log(`Admin created: ${adminUser}`);
}

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {httpOnly:true, sameSite:"lax", secure:false, maxAge: 1000*60*60*24}
}));
app.use(express.static(path.join(__dirname, "public")));

function currentUser(req) {
  if (!req.session.userId) return null;
  const u = db.prepare("SELECT * FROM users WHERE id=?").get(req.session.userId);
  if (!u || !u.active) return null;
  if (u.expires_at && u.expires_at < Date.now()) return null;
  return u;
}
function requireAuth(req,res,next){
  const u=currentUser(req);
  if(!u) return res.redirect("/login");
  req.user=u; next();
}
function requireAdmin(req,res,next){
  const u=currentUser(req);
  if(!u || u.username !== adminUser) return res.status(403).send("Admin access required");
  req.user=u; next();
}

app.get("/", (req,res)=>res.redirect("/home"));
app.get("/login", (req,res)=>res.sendFile(path.join(__dirname,"public","login.html")));
app.post("/login",(req,res)=>{
  const {username,password}=req.body;
  const u=db.prepare("SELECT * FROM users WHERE username=?").get(username);
  if(!u || !u.active || (u.expires_at && u.expires_at < Date.now()) || !bcrypt.compareSync(password,u.password_hash))
    return res.status(401).send("Invalid username, password, or expired account. <a href='/login'>Back</a>");
  req.session.userId=u.id;
  res.redirect(u.username===adminUser ? "/admin" : "/home");
});
app.post("/logout",(req,res)=>req.session.destroy(()=>res.redirect("/login")));

app.get("/home", requireAuth, (req,res)=>res.sendFile(path.join(__dirname,"public","home.html")));

app.get("/admin", requireAdmin, (req,res)=>res.sendFile(path.join(__dirname,"public","admin.html")));

app.get("/api/users", requireAdmin, (req,res)=>{
  const rows=db.prepare("SELECT id,username,expires_at,active,created_at FROM users ORDER BY id DESC").all();
  res.json(rows);
});
app.post("/api/users", requireAdmin, (req,res)=>{
  const {username,password,expiresAt,active=true}=req.body;
  if(!username || !password) return res.status(400).json({error:"username and password are required"});
  try {
    const result=db.prepare("INSERT INTO users(username,password_hash,expires_at,active,created_at) VALUES(?,?,?,?,?)")
      .run(username,bcrypt.hashSync(password,12), expiresAt ? new Date(expiresAt).getTime() : null, active?1:0, Date.now());
    res.json({ok:true,id:result.lastInsertRowid});
  } catch(e) { res.status(409).json({error:"Username already exists"}); }
});
app.patch("/api/users/:id", requireAdmin, (req,res)=>{
  const id=Number(req.params.id);
  const {password,expiresAt,active}=req.body;
  const u=db.prepare("SELECT * FROM users WHERE id=?").get(id);
  if(!u) return res.status(404).json({error:"Not found"});
  db.prepare("UPDATE users SET password_hash=?,expires_at=?,active=? WHERE id=?")
    .run(password ? bcrypt.hashSync(password,12) : u.password_hash,
         expiresAt===undefined ? u.expires_at : (expiresAt ? new Date(expiresAt).getTime() : null),
         active===undefined ? u.active : (active?1:0), id);
  res.json({ok:true});
});
app.delete("/api/users/:id", requireAdmin, (req,res)=>{
  const id=Number(req.params.id);
  const u=db.prepare("SELECT username FROM users WHERE id=?").get(id);
  if(!u || u.username===adminUser) return res.status(400).json({error:"Cannot delete admin"});
  db.prepare("DELETE FROM users WHERE id=?").run(id);
  res.json({ok:true});
});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));