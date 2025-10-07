export default function AdminForm({ onSubmit }) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-amber-50 p-6 rounded-xl shadow-md border-2 border-amber-200 space-y-4"
    >
      <div>
        <label className="block text-amber-900 font-semibold mb-2">
          Task Title
        </label>
        <input
          type="text"
          name="title"
          required
          placeholder="e.g., Clean espresso machine"
          className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
        />
      </div>
      <div>
        <label className="block text-amber-900 font-semibold mb-2">
          Description
        </label>
        <textarea
          name="description"
          required
          placeholder="Provide detailed instructions for this task..."
          className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white resize-none"
          rows="4"
        ></textarea>
      </div>
      <button
        type="submit"
        className="bg-amber-900 text-amber-50 px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors w-full font-semibold text-lg shadow-md flex items-center justify-center gap-2"
      >
        <span>✨</span> Create Task
      </button>
    </form>
  );
}