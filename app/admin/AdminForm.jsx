export default function AdminForm({ onSubmit, categories }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Title input */}
      <input
        type="text"
        name="title"
        placeholder="Task title"
        required
        className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none"
      />
      
      {/* Description textarea */}
      <textarea
        name="description"
        placeholder="Task description"
        required
        className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none resize-none"
        rows="3"
      />
      
      {/* Category dropdown */}
      <select
        name="category"
        required
        className="text-amber-800 border-2 border-amber-300 p-3 rounded-lg w-full focus:border-amber-500 focus:outline-none bg-white"
      >
        <option value="">Select a category</option>
        {categories?.map((cat) => (
          <option key={cat._id} value={cat._id}>
            {cat.name}
          </option>
        ))}
      </select>
      
      {/* Submit button */}
      <button
        type="submit"
        className="bg-amber-900 text-amber-50 w-full py-3 rounded-lg hover:bg-amber-800 transition-colors font-semibold"
      >
        Create Task
      </button>
    </form>
  );
}