import { BottomNav } from "@/components/BottomNav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* pb-24 reserva espaço para a barra fixa não cobrir o conteúdo */}
      <div className="mx-auto min-h-dvh max-w-md px-5 pb-24 pt-8">{children}</div>
      <BottomNav />
    </>
  );
}
