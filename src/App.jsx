import React, { useState } from 'react';
import { StoreProvider, useStore } from './context';
import {
  Header,
  LuxuryHero,
  ShopByDepartment,
  LuxuryFlagshipExperience,
  ProductCard,
  WishlistPage,
  CartPage,
  DeliveryAddressStep,
  PaymentOptionsStep,
  CheckoutPage,
  AccountDashboard,
  LoginPage,
  AIVirtualTryOnModal,
  Footer
} from './components';

/* =========================================================================
   FEATURED PRODUCTS MOCK DATA
   ========================================================================= */

const HOMEPAGE_PRODUCTS = [
  {
    id: 1,
    name: 'Royal Kanjivaram Pure Silk Zari Saree',
    category: 'Sarees',
    price: 3499,
    original_price: 6999,
    discount: 50,
    rating: 4.9,
    reviews_count: 38,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    available_sizes: ['Free Size'],
    stock: 8,
    badge: 'Trending'
  },
  {
    id: 2,
    name: 'Banarasi Designer Georgette Saree',
    category: 'Sarees',
    price: 4999,
    original_price: 7999,
    discount: 38,
    rating: 4.8,
    reviews_count: 24,
    image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80',
    available_sizes: ['Free Size'],
    stock: 5,
    badge: 'Heritage'
  },
  {
    id: 5,
    name: 'Kundan & Pearl Choker Bridal Necklace Set',
    category: 'Jewelry',
    price: 2499,
    original_price: 4500,
    discount: 44,
    rating: 5.0,
    reviews_count: 56,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80',
    available_sizes: ['One Size'],
    stock: 12,
    badge: 'Bestseller'
  },
  {
    id: 65,
    name: 'Organic Cotton Printed Baby Sleepsuit & Bib Combo (Set of 3)',
    category: 'Kids',
    price: 899,
    original_price: 1299,
    discount: 30,
    rating: 4.8,
    reviews_count: 42,
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=800&q=80',
    available_sizes: ['0–3 Months', '3–6 Months', '6–12 Months'],
    stock: 15,
    badge: 'Organic'
  }
];

/* =========================================================================
   MAIN APP INNER (CONSUMING STORE CONTEXT)
   ========================================================================= */

const AppContent = () => {
  const {
    isDarkMode,
    toggleDarkMode,
    cart,
    cartCount,
    wishlistCount,
    isInWishlist,
    toggleWishlist,
    addToCart,
    buyNow,
    checkoutStep,
    setCheckoutStep,
    isTryOnOpen,
    tryOnProduct,
    closeTryOn,
    openTryOn,
    toasts,
    dismissToast,
    user
  } = useStore();

  const [activeTab, setActiveTab] = useState('home');

  // Handle navigation
  const navigateTo = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      isDarkMode ? 'dark bg-[#0A0A0C] text-[#F5EFEB]' : 'bg-[#FDFBF7] text-[#111111]'
    }`}>
      {/* 1. Global Header */}
      <Header
        activeTab={activeTab}
        wishlistCount={wishlistCount}
        cartCount={cartCount}
        userName={user?.name || 'Om'}
        onThemeToggle={toggleDarkMode}
      />

      {/* 2. Main Page Router Switcher */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <div className="space-y-12 sm:space-y-16">
            {/* Dark Navy Luxury Hero */}
            <LuxuryHero
              primaryCtaLink="#catalog"
              secondaryCtaLink="#catalog"
            />

            {/* Shop By Department */}
            <ShopByDepartment />

            {/* Featured Highlights Catalog */}
            <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 mb-8 border-b border-neutral-200/80 pb-4">
                <div>
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#C5A880]">
                    CURATED ATELIER
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-inherit mt-1">
                    Featured Highlights
                  </h2>
                </div>
                <button
                  onClick={() => navigateTo('shop')}
                  className="text-xs font-semibold tracking-wider uppercase text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  View All Pieces →
                </button>
              </div>

              {/* 3:4 Portrait Product Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {HOMEPAGE_PRODUCTS.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isWishlisted={isInWishlist(product.id)}
                    onWishlistToggle={() => toggleWishlist(product)}
                    onAddToCart={() => addToCart(product)}
                    onBuyNow={() => {
                      buyNow(product);
                      navigateTo('delivery');
                    }}
                    onQuickView={() => openTryOn(product)}
                  />
                ))}
              </div>
            </section>

            {/* Artisanal Heritage Experience */}
            <LuxuryFlagshipExperience />
          </div>
        )}

        {/* Wishlist Page */}
        {activeTab === 'wishlist' && (
          <WishlistPage
            onExploreCatalog={() => navigateTo('home')}
            onAddToCart={(item) => addToCart(item)}
          />
        )}

        {/* Cart Page */}
        {activeTab === 'cart' && (
          <CartPage
            onProceedToCheckout={() => navigateTo('delivery')}
            onExploreCatalog={() => navigateTo('home')}
          />
        )}

        {/* Checkout Step 2: Delivery Address */}
        {activeTab === 'delivery' && (
          <DeliveryAddressStep
            onProceedToPayment={() => navigateTo('payment')}
            onBackToCart={() => navigateTo('cart')}
          />
        )}

        {/* Checkout Step 3: Payment Options & Full Review */}
        {(activeTab === 'payment' || activeTab === 'checkout') && (
          <CheckoutPage
            onBackToCart={() => navigateTo('cart')}
            onBackToAddress={() => navigateTo('delivery')}
            onOrderSuccess={() => navigateTo('account')}
          />
        )}

        {/* Account Dashboard */}
        {activeTab === 'account' && (
          <AccountDashboard onExploreCatalog={() => navigateTo('home')} />
        )}

        {/* Patron Login & Authentication */}
        {activeTab === 'login' && (
          <LoginPage
            onSuccess={() => navigateTo('account')}
            onNavigateTo={navigateTo}
          />
        )}
      </main>

      {/* 3. Global AI Virtual Dressing Room Modal */}
      {isTryOnOpen && (
        <AIVirtualTryOnModal
          isOpen={isTryOnOpen}
          onClose={closeTryOn}
          garmentTitle={tryOnProduct?.name || 'Artisanal Saree'}
          garmentImage={tryOnProduct?.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
          garmentPrice={tryOnProduct?.price ? `₹${tryOnProduct.price.toLocaleString('en-IN')}` : '₹3,499'}
          onAddToCart={() => {
            if (tryOnProduct) addToCart(tryOnProduct);
            closeTryOn();
          }}
        />
      )}

      {/* 4. Global Toast Notification Dock */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismissToast(t.id)}
            className={`pointer-events-auto px-4 py-3 rounded-xl shadow-xl text-xs font-medium tracking-wide flex items-center gap-2.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              t.type === 'error'
                ? 'bg-rose-950 text-rose-100 border border-rose-800'
                : t.type === 'info'
                ? 'bg-neutral-900 text-neutral-100 border border-neutral-700'
                : 'bg-[#0F382A] text-emerald-100 border border-emerald-700'
            }`}
          >
            <span>{t.type === 'error' ? '⚠️' : t.type === 'info' ? 'ℹ️' : '✦'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* 5. Luxury Website Footer */}
      <Footer />
    </div>
  );
};

/* =========================================================================
   EXPORT ROOT APP WITH PROVIDER
   ========================================================================= */

export const App = () => (
  <StoreProvider>
    <AppContent />
  </StoreProvider>
);

export default App;
