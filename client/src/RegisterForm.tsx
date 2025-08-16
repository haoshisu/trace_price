import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

type FormData = {
 username: string;
 password: string;
 email: string;
};

export default function RegisterForm() {
 const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  reset,
 } = useForm<FormData>({ mode: "onChange" });
 const [showPw, setShowPw] = useState(false);

 // 註冊表單送出事件
 const onSubmit = async (data: FormData) => {
  // 你可以根據實際後端 API 改這裡
  const res = await fetch("http://localhost:3001/register", {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify(data),
  });
  const result = await res.json();
  console.log(result);
  if (result.success) {
   alert("註冊成功！請登入");
   reset();
  } else {
   alert(result.error || "註冊失敗");
  }
 };

 return (
  <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
   {/* 黏性頂欄（與正式頁一致） */}
   <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
    <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
     <div className="flex items-center gap-3">
      <span
       aria-hidden
       className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white text-sm"
      >
       ￥
      </span>
      <div>
       <h1 className="text-lg font-semibold text-slate-900 leading-tight">商品價格追蹤器</h1>
       <p className="text-xs text-slate-500">到價通知・歷史價格趨勢</p>
      </div>
     </div>

     {/* 右側可放返回或品牌連結 */}
     <Link
      to="/"
      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
     >
      回首頁
     </Link>
    </div>
   </header>

   <main className="mx-auto max-w-md px-4 py-10">
    {/* 卡片化表單（與正式頁表單卡片一致） */}
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
     <h2 className="text-xl font-semibold text-center text-slate-900">會員註冊</h2>
     <p className="mt-1 mb-6 text-center text-xs text-slate-500">
      建立帳號以追蹤商品並接收到價通知
     </p>

     <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* 帳號欄 */}
      <div>
       <label htmlFor="username" className="mb-1 block text-sm font-medium text-slate-700">
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
        <p id="username-error" className="mt-1 text-xs text-rose-600">
         {errors.username.message as string}
        </p>
       )}
      </div>

      {/* 密碼欄（加上可視切換） */}
      <div>
       <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
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
        <p id="password-error" className="mt-1 text-xs text-rose-600">
         {errors.password.message as string}
        </p>
       )}
      </div>

      {/* 信箱欄 */}
      <div>
       <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
        信箱
       </label>
       <input
        id="email"
        className={[
         "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none",
         "transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
         errors.email ? "border-rose-300 focus:ring-rose-400" : "",
        ].join(" ")}
        type="email"
        {...register("email", {
         required: "信箱必填",
         pattern: {
          value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
          message: "信箱格式不正確",
         },
        })}
        placeholder="請輸入信箱"
        aria-invalid={!!errors.email}
        aria-describedby={errors.email ? "email-error" : undefined}
       />
       {errors.email && (
        <p id="email-error" className="mt-1 text-xs text-rose-600">
         {errors.email.message as string}
        </p>
       )}
      </div>

      <button
       type="submit"
       disabled={isSubmitting}
       className={[
        "w-full rounded-xl px-4 py-2.5 text-sm font-medium text-white",
        isSubmitting
         ? "bg-slate-300 cursor-not-allowed"
         : "bg-blue-600 hover:bg-blue-700 shadow-sm",
       ].join(" ")}
      >
       {isSubmitting ? "註冊中…" : "註冊"}
      </button>
     </form>

     {/* 底部引導 */}
     <div className="mt-4 text-center text-sm text-slate-600">
      已有帳號？{" "}
      <Link to="/login" className="text-blue-600 hover:underline">
       立即登入
      </Link>
     </div>
    </div>
   </main>

   <footer className="mx-auto max-w-md px-4 py-10 text-xs text-slate-500">
    <p>本工具僅用於協助用戶追蹤公開商品頁之價格變化；實際價格與庫存以原網站為準。</p>
   </footer>
  </div>

  //   <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-12">
  //    <h2 className="text-2xl font-bold text-center mb-6">會員註冊</h2>
  //    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
  //     {/* 帳號欄 */}
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

  //     {/* 密碼欄 */}
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

  //     {/* 信箱欄 */}
  //     <div>
  //      <label className="block mb-1 font-medium">信箱</label>
  //      <input
  //       className="w-full border rounded px-3 py-2"
  //       type="email"
  //       {...register("email", {
  //        required: "信箱必填",
  //        pattern: {
  //         value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  //         message: "信箱格式不正確",
  //        },
  //       })}
  //       placeholder="請輸入信箱"
  //      />
  //      {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
  //     </div>

  //     <button
  //      type="submit"
  //      disabled={isSubmitting}
  //      className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
  //     >
  //      {isSubmitting ? "註冊中..." : "註冊"}
  //     </button>
  //    </form>
  //   </div>
 );
}
