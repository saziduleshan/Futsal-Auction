export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/Allpagebackground.png)' }} />
      <div className="fixed inset-0 bg-black/30" />
      <div className="relative z-10 px-3 py-3 md:px-4 md:py-4">
        {children}
      </div>
    </div>
  );
}
