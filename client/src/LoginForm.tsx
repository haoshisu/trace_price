import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

type LoginFormData = {
 username: string;
 password: string;
};

export default function LoginForm({ onLoginSuccess }: { onLoginSuccess?: () => void }) {
 const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
 } = useForm<LoginFormData>();
 const navigate = useNavigate();
 const [showPw, setShowPw] = useState(false);

 const onSubmit = async (data: LoginFormData) => {
  const res = await fetch("https://trace-price-backend.onrender.com/login", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  const result = await res.json();
  if (result.token) {
   localStorage.setItem("token", result.token); // 儲存 JWT
   alert("登入成功！");
   reset();
   if (onLoginSuccess) onLoginSuccess();
   // 你可以改成 router 跳轉頁面
   navigate("/dashboard");
  } else {
   alert(result.error || "登入失敗");
  }
 };

 return (
  <div className="max-w-md mx-auto mt-12 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
   <h2 className="text-xl font-semibold text-center text-slate-900 mb-1">會員登入</h2>
   <p className="text-xs text-slate-500 text-center mb-6">使用帳號登入以管理你的追蹤清單</p>

   <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* 帳號 */}
    <div>
     <label htmlFor="username" className="block mb-1 text-sm font-medium text-slate-700">
      帳號
     </label>
     <input
      id="username"
      className={[
       "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none",
       "transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
       errors.username ? "border-rose-300 focus:ring-rose-400" : "",
      ].join(" ")}
      {...register("username", {
       required: "帳號必填",
       minLength: { value: 4, message: "帳號至少 4 字元" },
       pattern: { value: /^[a-zA-Z0-9_]+$/, message: "只允許英文、數字、底線" },
      })}
      placeholder="請輸入帳號"
      aria-invalid={!!errors.username}
      aria-describedby={errors.username ? "username-error" : undefined}
     />
     {errors.username && (
      <span id="username-error" className="mt-1 block text-xs text-rose-600">
       {errors.username.message as string}
      </span>
     )}
    </div>

    {/* 密碼（可視切換） */}
    <div>
     <label htmlFor="password" className="block mb-1 text-sm font-medium text-slate-700">
      密碼
     </label>
     <div className="relative">
      <input
       id="password"
       className={[
        "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 pr-20 text-sm outline-none",
        "transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
        errors.password ? "border-rose-300 focus:ring-rose-400" : "",
       ].join(" ")}
       type={showPw ? "text" : "password"}
       {...register("password", {
        required: "密碼必填",
        minLength: { value: 6, message: "密碼至少 6 字元" },
       })}
       placeholder="請輸入密碼"
       aria-invalid={!!errors.password}
       aria-describedby={errors.password ? "password-error" : undefined}
      />
      <button
       type="button"
       onClick={() => setShowPw((v) => !v)}
       className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200 hover:bg-white"
       aria-label={showPw ? "隱藏密碼" : "顯示密碼"}
      >
       {showPw ? "隱藏" : "顯示"}
      </button>
     </div>
     {errors.password && (
      <span id="password-error" className="mt-1 block text-xs text-rose-600">
       {errors.password.message as string}
      </span>
     )}
    </div>

    <button
     type="submit"
     disabled={isSubmitting}
     className={[
      "w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white",
      isSubmitting ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm",
     ].join(" ")}
    >
     {isSubmitting ? "登入中…" : "登入"}
    </button>
   </form>

   <div className="mt-4 text-center text-sm text-slate-600">
    沒有帳號？{" "}
    <Link to="/register" className="text-blue-600 hover:underline">
     去註冊
    </Link>
   </div>
  </div>

  //   <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-12">
  //    <h2 className="text-2xl font-bold text-center mb-6">會員登入</h2>
  //    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  //     {/* 帳號 */}
  //     <div>
  //      <label className="block mb-1 font-medium">帳號</label>
  //      <input
  //       className="w-full border rounded px-3 py-2"
  //       {...register("username", {
  //        required: "帳號必填",
  //        minLength: { value: 4, message: "帳號至少 4 字元" },
  //        pattern: { value: /^[a-zA-Z0-9_]+$/, message: "只允許英文、數字、底線" },
  //       })}
  //       placeholder="請輸入帳號"
  //      />
  //      {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
  //     </div>
  //     {/* 密碼 */}
  //     <div>
  //      <label className="block mb-1 font-medium">密碼</label>
  //      <input
  //       className="w-full border rounded px-3 py-2"
  //       type="password"
  //       {...register("password", {
  //        required: "密碼必填",
  //        minLength: { value: 6, message: "密碼至少 6 字元" },
  //       })}
  //       placeholder="請輸入密碼"
  //      />
  //      {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
  //     </div>
  //     <button
  //      type="submit"
  //      disabled={isSubmitting}
  //      className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
  //     >
  //      {isSubmitting ? "登入中..." : "登入"}
  //     </button>
  //    </form>
  //   </div>
 );
}
