
export default function FetchLoading(){

    return(
        <div className="fixed inset-0 bg-gray-100 bg-opacity-90 flex items-center justify-center z-50">
        <div >
          <div className="flex justify-center space-x-1">
            <span className="text-xl font-semibold text-gray-700 animate-pulse">L</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-100">o</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-200">a</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-300">d</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-400">i</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-500">n</span>
            <span className="text-xl font-semibold text-gray-700 animate-pulse delay-600">g</span>
          </div>
      
          <p className="mt-2 text-gray-500 text-sm">正在連繫伺服器，請稍候...</p>
        </div>
      </div>
      
  );
};
