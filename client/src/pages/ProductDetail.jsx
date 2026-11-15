import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { formatPrice } from '../format';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api(`/products/${id}`)
      .then((p) => {
        if (!cancelled) {
          setProduct(p);
          setActive(0);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link to="/products" className="mt-4 inline-block text-amber-700">Back to products</Link>
      </div>
    );
  }
  if (!product) return <p className="p-8 text-center text-stone-500">Loading...</p>;

  const images = product.images || [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/products" className="text-sm text-amber-700">Back to products</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div>
          {images.length > 0 ? (
            <>
              <img src={images[active].url} alt={product.name} className="h-80 w-full rounded-xl object-cover" />
              {images.length > 1 && (
                <div className="mt-3 flex gap-2">
                  {images.map((img, i) => (
                    <button key={img._id || i} onClick={() => setActive(i)} className={`overflow-hidden rounded-lg border-2 ${i === active ? 'border-amber-600' : 'border-transparent'}`}>
                      <img src={img.url} alt="" className="h-16 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
              No photo yet
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold text-amber-700">{formatPrice(product.price)}</p>
          <p className={`mt-2 text-sm font-medium ${product.stock > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>
          {product.description && <p className="mt-4 text-stone-700">{product.description}</p>}

          {product.profile && (
            <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-sm text-stone-500">Sold by</p>
              <Link to={`/entrepreneurs/${product.profile._id}`} className="font-semibold text-amber-700">
                {product.profile.businessName}
              </Link>
              <p className="text-sm text-stone-500">
                {product.profile.skillType}, {product.profile.city}
              </p>
              {product.profile.phone && <p className="text-sm text-stone-500">Phone: {product.profile.phone}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}