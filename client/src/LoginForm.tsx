import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

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
  <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-12">
   <h2 className="text-2xl font-bold text-center mb-6">會員登入</h2>
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* 帳號 */}
    <div>
     <label className="block mb-1 font-medium">帳號</label>
     <input
      className="w-full border rounded px-3 py-2"
      {...register("username", {
       required: "帳號必填",
       minLength: { value: 4, message: "帳號至少 4 字元" },
       pattern: { value: /^[a-zA-Z0-9_]+$/, message: "只允許英文、數字、底線" },
      })}
      placeholder="請輸入帳號"
     />
     {errors.username && <span className="text-red-500 text-sm">{errors.username.message}</span>}
    </div>
    {/* 密碼 */}
    <div>
     <label className="block mb-1 font-medium">密碼</label>
     <input
      className="w-full border rounded px-3 py-2"
      type="password"
      {...register("password", {
       required: "密碼必填",
       minLength: { value: 6, message: "密碼至少 6 字元" },
      })}
      placeholder="請輸入密碼"
     />
     {errors.password && <span className="text-red-500 text-sm">{errors.password.message}</span>}
    </div>
    <button
     type="submit"
     disabled={isSubmitting}
     className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
    >
     {isSubmitting ? "登入中..." : "登入"}
    </button>
   </form>
  </div>
 );
}
