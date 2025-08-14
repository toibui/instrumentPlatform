// app/page.tsx
export default function WaitingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🚧 Dự Án Đang Nâng Cấp
        </h1>
        <p className="text-gray-600 mb-6">
          Chúng tôi đang phát triển tính năng mới này để mang lại trải nghiệm tốt hơn cho bạn
          Vui lòng quay lại sau.
        </p>
        <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-gray-500">
          Cảm ơn bạn đã kiên nhẫn ❤️
        </p>
      </div>
    </div>
  );
}
