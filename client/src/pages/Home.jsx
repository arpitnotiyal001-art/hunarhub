import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl sm:text-5xl font-bold text-amber-700">Discover local talent</h1>
      <p className="mt-4 text-lg text-stone-600 max-w-2xl mx-auto">
        HunarHub connects cobblers, potters, tailors, artisans and small vendors with
        customers who value handmade work.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/browse"
          className="rounded-lg bg-amber-600 px-6 py-3 font-semibold text-white hover:bg-amber-700"
        >
          Browse entrepreneurs
        </Link>
        <Link
          to="/register"
          className="rounded-lg border border-amber-600 px-6 py-3 font-semibold text-amber-700 hover:bg-amber-50"
        >
          Join as an entrepreneur
        </Link>
      </div>
    </section>
  );
}