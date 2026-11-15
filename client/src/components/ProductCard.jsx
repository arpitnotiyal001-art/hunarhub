import { Link } from 'react-router-dom';
import { formatPrice } from '../format';

export default function ProductCard({ product, showSeller = true }) {
  const image = product.images && product.images[0];
  return (
    <Link
      to={`/products/${product._id}`}
      className="block overflow-hidden rounded-xl border border-stone-200 bg-white transition hover:shadow-md"
    >
      {image ? (
        <img src={image.url} alt={product.name} loading="lazy" className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 items-center justify-center bg-stone-100 text-sm text-stone-400">
          No photo yet
        </div>
      )}
      <div className="p-4">
        <h3 className="font-semibold text-stone-800">{product.name}</h3>
        {showSeller && product.profile && (
          <p className="mt-1 text-sm text-stone-500">
            {product.profile.businessName}, {product.profile.city}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold text-amber-700">{formatPrice(product.price)}</span>
          {product.stock < 1 && <span className="text-xs font-medium text-red-600">Out of stock</span>}
        </div>
      </div>
    </Link>
  );
}