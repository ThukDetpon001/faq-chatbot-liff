import React, { useEffect, useRef, useState } from "react";
import liff from "@line/liff";
import "./App.css";

// ตั้งค่าของคุณ
const LIFF_ID = "YOUR_LIFF_ID";
const PROXY_URL =
  "https://script.google.com/macros/s/AKfycbwAgauAoI4z1XXuISfwcNY-ANLyPuQtQFIWZU9DRvOoATIC80UenXbPlBl4sUKfwvZbng/exec";

const HISTORY_KEY = "traffy-liff-chat-history";

function formatTime(isoString) {
  const dt = new Date(isoString);
  try {
    return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dt.toISOString().substring(11, 16);
  }
}

export default function App() {
  const [subtitle, setSubtitle] = useState("กำลังเตรียม LIFF...");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesRef = useRef(null);

  // เลื่อนลงล่างสุดเมื่อมีข้อความใหม่ + บันทึกประวัติ
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
    try {
      const payload = messages.map((m) => ({
        text: m.text,
        from: m.from,
        ts: m.ts,
      }));
      localStorage.setItem(HISTORY_KEY, JSON.stringify(payload.slice(-100)));
    } catch {}
  }, [messages]);

  // โหลดประวัติจาก localStorage
  const loadHistory = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(arr)) {
        setMessages(
          arr.map((it) => ({
            text: it.text,
            from: it.from === "me" ? "me" : "bot",
            ts: it.ts || new Date().toISOString(),
          }))
        );
      }
    } catch {}
  };

  // เพิ่มบับเบิล
  const addBubble = (text, from = "bot", ts = null) => {
    setMessages((prev) => [
      ...prev,
      { text, from: from === "me" ? "me" : "bot", ts: ts || new Date().toISOString() },
    ]);
  };

  // เรียก Proxy พร้อมแนบ idToken (ถ้ามี)
  const ask = async (question) => {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 15000);
    try {
      const idToken = liff.isLoggedIn() ? liff.getIDToken() : null;

      const res = await fetch(PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // simple request
        body: JSON.stringify({ question, idToken }),
        signal: controller.signal,
      });
      clearTimeout(to);
      if (!res.ok) {
        const t = await res.text().catch(() => res.statusText);
        throw new Error("HTTP " + res.status + ": " + t);
      }
      const data = await res.json().catch(() => ({ answer: "รูปแบบคำตอบไม่ใช่ JSON" }));
      return data.answer || JSON.stringify(data);
    } catch (err) {
      clearTimeout(to);
      throw err;
    }
  };

  // ส่งคำถาม
  const onSubmit = async (e) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    addBubble(q, "me");
    setInput("");
    setIsTyping(true);
    setSubtitle("กำลังพิมพ์คำตอบ...");
    try {
      const ans = await ask(q);
      setIsTyping(false);
      addBubble(ans, "bot");
      setSubtitle("ออนไลน์");
    } catch (err) {
      setIsTyping(false);
      addBubble("เกิดข้อผิดพลาด: " + err.message, "bot");
      setSubtitle("เกิดข้อผิดพลาด");
    }
  };

  // เริ่มต้น LIFF ด้วยแพ็กเกจ @line/liff
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await liff.init({ liffId: LIFF_ID });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const profile = await liff.getProfile().catch(() => null);
        if (!mounted) return;
        setSubtitle(profile ? "สวัสดี " + profile.displayName : "ออนไลน์");

        loadHistory();
        try {
          const raw = localStorage.getItem(HISTORY_KEY);
          const arr = raw ? JSON.parse(raw) : [];
          if (!arr || arr.length === 0) {
            addBubble('สวัสดีค่ะ ฉันคือผู้ช่วย Traffy Fondue ถามได้เลย เช่น "วิธีการแจ้ง"', "bot");
          }
        } catch {
          addBubble('สวัสดีค่ะ ฉันคือผู้ช่วย Traffy Fondue ถามได้เลย เช่น "วิธีการแจ้ง"', "bot");
        }
      } catch (e) {
        if (!mounted) return;
        setSubtitle("โหมดเว็บปกติ");
        loadHistory();
        // addBubble("คุณกำลังใช้งานนอก LIFF ระบบยังคงตอบได้ แต่จะไม่ส่ง idToken", "bot");
        addBubble('สวัสดีค่ะ ฉันคือผู้ช่วย Traffy Fondue ถามได้เลย เช่น "วิธีการแจ้ง" ', "bot");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Enter เพื่อส่ง, Shift+Enter ขึ้นบรรทัดใหม่
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="chatwin" role="dialog" aria-label="Traffy Fondue Chat Support">
      <div className="chat-header">
        <div>
          <div className="title">Traffy Fondue ช่วยเหลือ</div>
          <div className="subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="messages" ref={messagesRef}>
        {messages.map((m, idx) => (
          <div key={idx}>
            <div className={`bubble ${m.from === "me" ? "me" : "bot"}`} data-ts={m.ts} data-text={m.text}>
              {m.text}
            </div>
            <div className="timestamp">{formatTime(m.ts)}</div>
          </div>
        ))}
        {isTyping && (
          <div>
            <div className="bubble bot">
              <span className="typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      <form className="inputbar" onSubmit={onSubmit}>
        <textarea
          placeholder="พิมพ์คำถาม แล้วกด Enter เพื่อส่ง"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button type="submit">ส่ง</button>
      </form>
    </div>
  );
}
