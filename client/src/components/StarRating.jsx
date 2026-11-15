export default function StarRating({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`${value} out of 5 stars`}>
      <span className="text-amber-500">
        {'★'.repeat(full)}
        <span className="text-stone-300">{'★'.repeat(5 - full)}</span>
      </span>
      {count !== undefined && (
        <span className="text-stone-500">{count > 0 ? `${value} (${count})` : 'No reviews yet'}</span>
      )}
    </span>
  );
}