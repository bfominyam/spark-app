import { useState } from "react";
import { supabase } from "./supabase";

const C = {
  fire: "#FF3B5C", fireGlow: "#ff6b35", dark: "#0d0d0d",
  card: "#1a1a2e", muted: "#8888aa", match: "#00d2a0",
};
const grad = { background: `linear-gradient(135deg, #FF3B5C, #ff6b35)` };

export default function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("welcome"); // welcome | login | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" }); // type: success | error

  const showMsg = (text, type = "error") => setMsg({ text, type });

  const handleSignUp = async () => {
    if (!email || !password) { showMsg("Please enter email and password"); return; }
    if (password.length < 6) { showMsg("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) { showMsg(error.message); return; }
    showMsg("✅ Account created! You can now sign in.", "success");
    setMode("login");
  };

  const handleLogin = async () => {
    if (!email || !password) { showMsg("Please enter email and password"); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { showMsg(error.message); return; }
    onAuth(data.user);
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) { showMsg(error.message); setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email) { showMsg("Enter your email address first"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    setLoading(false);
    if (error) { showMsg(error.message); return; }
    showMsg("✅ Password reset email sent! Check your inbox.", "success");
  };

  const ff = "'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{ width: "100%", maxWidth: 420, height: 680, margin: "0 auto", borderRadius: 28, overflow: "hidden", fontFamily: ff, background: C.dark, display: "flex", flexDirection: "column", boxShadow: "0 30px 80px rgba(0,0,0,0.6)", position: "relative" }}>

      {/* Background glow */}
      <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 300, height: 300, background: "radial-gradient(circle, rgba(255,59,92,0.15), transparent 70%)", pointerEvents: "none" }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 28px", position: "relative" }}>

        {/* Logo */}
        <div style={{ marginBottom: 8, fontSize: 52 }}>🔥</div>
        <div style={{ fontFamily: ff, fontWeight: 900, fontSize: 32, background: `linear-gradient(135deg,#FF3B5C,#ff6b35)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>Spark</div>
        <div style={{ color: C.muted, fontSize: 14, marginBottom: 36, textAlign: "center" }}>
          {mode === "welcome" && "Find the love worth fighting for"}
          {mode === "login" && "Welcome back 👋"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
        </div>

        {/* WELCOME screen */}
        {mode === "welcome" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setMode("signup")}
              style={{ width: "100%", padding: "15px 0", borderRadius: 24, ...grad, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 20px rgba(255,59,92,0.35)" }}>
              Create Account 🔥
            </button>
            <button onClick={() => setMode("login")}
              style={{ width: "100%", padding: "15px 0", borderRadius: 24, background: "transparent", border: "2px solid #333", color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>
              Sign In
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#333" }} />
              <div style={{ color: C.muted, fontSize: 12 }}>or</div>
              <div style={{ flex: 1, height: 1, background: "#333" }} />
            </div>
            <button onClick={handleGoogle}
              style={{ width: "100%", padding: "14px 0", borderRadius: 24, background: "#fff", border: "none", color: "#333", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>G</span> Continue with Google
            </button>
          </div>
        )}

        {/* EMAIL FORM — login or signup */}
        {(mode === "login" || mode === "signup" || mode === "forgot") && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Email</div>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setMsg({ text: "", type: "" }); }}
                placeholder="you@email.com"
                style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 14, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
            </div>

            {mode !== "forgot" && (
              <div>
                <div style={{ color: C.muted, fontSize: 12, marginBottom: 6 }}>Password</div>
                <input type="password" value={password} onChange={e => { setPassword(e.target.value); setMsg({ text: "", type: "" }); }}
                  placeholder="••••••••"
                  onKeyDown={e => e.key === "Enter" && (mode === "login" ? handleLogin() : handleSignUp())}
                  style={{ width: "100%", background: "#1e1e30", border: "1px solid #333", borderRadius: 14, padding: "12px 16px", color: "#fff", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
              </div>
            )}

            {msg.text && (
              <div style={{ color: msg.type === "success" ? C.match : C.fire, fontSize: 13, textAlign: "center", background: msg.type === "success" ? C.match+"15" : C.fire+"15", borderRadius: 10, padding: "8px 12px" }}>
                {msg.text}
              </div>
            )}

            <button
              onClick={mode === "login" ? handleLogin : mode === "signup" ? handleSignUp : handleForgot}
              disabled={loading}
              style={{ width: "100%", padding: "14px 0", borderRadius: 24, ...grad, border: "none", color: "#fff", fontWeight: 800, fontSize: 16, cursor: loading ? "default" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : mode === "signup" ? "Create Account 🔥" : "Send Reset Email"}
            </button>

            {/* Google button */}
            {mode !== "forgot" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 1, background: "#333" }} />
                  <div style={{ color: C.muted, fontSize: 12 }}>or</div>
                  <div style={{ flex: 1, height: 1, background: "#333" }} />
                </div>
                <button onClick={handleGoogle}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 24, background: "#fff", border: "none", color: "#333", fontWeight: 700, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>G</span> Continue with Google
                </button>
              </>
            )}

            {/* Toggle links */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 4 }}>
              {mode === "login" && (
                <>
                  <button onClick={() => { setMode("signup"); setMsg({ text: "", type: "" }); }} style={{ background: "none", border: "none", color: C.fire, fontSize: 13, cursor: "pointer" }}>Create account</button>
                  <button onClick={() => { setMode("forgot"); setMsg({ text: "", type: "" }); }} style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer" }}>Forgot password?</button>
                </>
              )}
              {(mode === "signup" || mode === "forgot") && (
                <button onClick={() => { setMode("login"); setMsg({ text: "", type: "" }); }} style={{ background: "none", border: "none", color: C.fire, fontSize: 13, cursor: "pointer" }}>← Back to sign in</button>
              )}
            </div>
          </div>
        )}

        {mode === "welcome" && (
          <div style={{ color: C.muted, fontSize: 11, marginTop: 24, textAlign: "center", lineHeight: 1.6 }}>
            By continuing you agree to our Terms of Service and Privacy Policy
          </div>
        )}
      </div>
    </div>
  );
}

