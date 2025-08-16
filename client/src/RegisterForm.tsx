import { useForm } from "react-hook-form";

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
  <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md mt-12">
   <h2 className="text-2xl font-bold text-center mb-6">會員註冊</h2>
   <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
    {/* 帳號欄 */}
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

    {/* 密碼欄 */}
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

    {/* 信箱欄 */}
    <div>
     <label className="block mb-1 font-medium">信箱</label>
     <input
      className="w-full border rounded px-3 py-2"
      type="email"
      {...register("email", {
       required: "信箱必填",
       pattern: {
        value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
        message: "信箱格式不正確",
       },
      })}
      placeholder="請輸入信箱"
     />
     {errors.email && <span className="text-red-500 text-sm">{errors.email.message}</span>}
    </div>

    <button
     type="submit"
     disabled={isSubmitting}
     className="w-full bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
    >
     {isSubmitting ? "註冊中..." : "註冊"}
    </button>
   </form>
  </div>
 );
}
