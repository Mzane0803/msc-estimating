"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Printer, ChevronLeft } from "lucide-react";
import {
  computeBid,
  costByTrade,
  extendedCost,
  keyMaterialTotals,
  tradeSubtotal,
} from "@/lib/estimate";
import { province } from "@/lib/trades";
import { formatPKR, formatQty, percent } from "@/lib/format";
import { useStore } from "@/components/store/store-provider";
import { Button } from "@/components/ui/button";

function PrintInner() {
  const id = useSearchParams().get("p") ?? "";
  const store = useStore();
  const project = store.getProject(id);

  if (!project) {
    return (
      <div className="p-10 text-center text-sm text-muted">
        Project not found. <Link href="/projects" className="text-accent">Back</Link>
      </div>
    );
  }

  const bid = computeBid(project);
  const trades = costByTrade(project.lineItems);
  const km = keyMaterialTotals(project.lineItems);
  const contractor = store.getContractor(project.contractorId);
  const prov = province(project.province);

  return (
    <div className="min-h-screen bg-surface-muted print:bg-white">
      <div className="no-print sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-6 backdrop-blur">
        <Link href={`/project?p=${project.id}`} className="flex items-center gap-1 text-[13px] text-muted hover:text-foreground">
          <ChevronLeft className="size-4" /> Back to estimate
        </Link>
        <div className="ml-auto">
          <Button size="sm" onClick={() => window.print()}>
            <Printer /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div className="print-doc mx-auto my-6 w-full max-w-[850px] bg-white p-10 text-[12px] text-black shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <div className="border-b-2 border-black pb-3 text-center">
          <div className="text-lg font-bold uppercase tracking-wide">{contractor?.name ?? "Contractor"}</div>
          <div className="text-[11px] text-neutral-600">
            PEC Registration {contractor?.pecCategory ?? "—"} · NTN {contractor?.ntn ?? "—"}
          </div>
          <div className="mt-2 text-[13px] font-semibold uppercase">Bill of Quantities &amp; Bid Summary</div>
        </div>

        <table className="mt-4 w-full border-collapse text-[11px]">
          <tbody>
            <MetaRow l1="Project" v1={project.name} l2="Client" v2={project.client} />
            <MetaRow l1="Location" v1={project.location} l2="Province" v2={`${prov.name} (${prov.authority})`} />
            <MetaRow l1="Schedule" v1={project.csrSchedule} l2="Covered Area" v2={`${formatQty(project.area)} Sft`} />
            <MetaRow l1="Duration" v1={`${project.durationMonths} months`} l2="Start" v2={project.startDate} />
          </tbody>
        </table>

        <div className="mt-6 text-[12px] font-semibold uppercase">A. Bill of Quantities</div>
        <table className="mt-1 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-black bg-neutral-100 text-left">
              <Th className="w-8">#</Th>
              <Th className="w-16">Code</Th>
              <Th>Description</Th>
              <Th className="w-16 text-right">Qty</Th>
              <Th className="w-12">Unit</Th>
              <Th className="w-24 text-right">Rate</Th>
              <Th className="w-28 text-right">Amount</Th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => {
              const items = project.lineItems.filter((li) => li.tradeId === t.tradeId);
              return (
                <Trade key={t.tradeId} name={t.name} subtotal={tradeSubtotal(project.lineItems, t.tradeId)}>
                  {items.map((li, i) => {
                    const r = li.cost.material + li.cost.labor + li.cost.equipment;
                    return (
                      <tr key={li.id} className="border-b border-neutral-200">
                        <Td>{i + 1}</Td>
                        <Td className="tabular">{li.itemCode}</Td>
                        <Td>{li.description}</Td>
                        <Td className="text-right tabular">{formatQty(li.quantity, li.quantity % 1 ? 2 : 0)}</Td>
                        <Td>{li.unit}</Td>
                        <Td className="text-right tabular">{formatPKR(r)}</Td>
                        <Td className="text-right tabular">{formatPKR(extendedCost(li))}</Td>
                      </tr>
                    );
                  })}
                </Trade>
              );
            })}
          </tbody>
        </table>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <div className="text-[12px] font-semibold uppercase">B. Abstract of Cost</div>
            <table className="mt-1 w-full border-collapse text-[11px]">
              <tbody>
                {trades.map((t) => (
                  <tr key={t.tradeId} className="border-b border-neutral-200">
                    <Td>{t.name}</Td>
                    <Td className="text-right tabular">{formatPKR(t.amount)}</Td>
                  </tr>
                ))}
                <tr className="border-y border-black font-semibold">
                  <Td>Direct Cost</Td>
                  <Td className="text-right tabular">{formatPKR(bid.directCost)}</Td>
                </tr>
              </tbody>
            </table>

            <div className="mt-4 text-[12px] font-semibold uppercase">D. Key Materials</div>
            <table className="mt-1 w-full border-collapse text-[11px]">
              <tbody>
                <KmRow label="Cement" value={`${formatQty(Math.round(km.cementBags))} bags`} />
                <KmRow label="Steel / Rebar" value={`${formatQty(km.steelTons, 1)} Ton`} />
                <KmRow label="Bricks" value={`${formatQty(Math.round(km.bricks))} Nos`} />
                <KmRow label="Sand" value={`${formatQty(Math.round(km.sandCft))} Cft`} />
                <KmRow label="Crush" value={`${formatQty(Math.round(km.aggregateCft))} Cft`} />
              </tbody>
            </table>
          </div>

          <div>
            <div className="text-[12px] font-semibold uppercase">C. Bid Build-Up</div>
            <table className="mt-1 w-full border-collapse text-[11px]">
              <tbody>
                <tr className="border-b border-neutral-200">
                  <Td>Direct Cost</Td>
                  <Td className="text-right tabular">{formatPKR(bid.directCost)}</Td>
                </tr>
                {bid.markupLines.map((l) => (
                  <tr key={l.key} className="border-b border-neutral-200">
                    <Td>
                      {l.key === "salesTax" ? `Sales Tax (${prov.authority})` : l.label}{" "}
                      <span className="text-neutral-500">@ {percent(l.rate, 1)}</span>
                    </Td>
                    <Td className="text-right tabular">{formatPKR(l.amount)}</Td>
                  </tr>
                ))}
                <tr className="border-y-2 border-black font-bold">
                  <Td>TOTAL BID</Td>
                  <Td className="text-right tabular">{formatPKR(bid.bidTotal)}</Td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <Td>Rate per Sft</Td>
                  <Td className="text-right tabular">{formatPKR(bid.costPerSft)}</Td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <Td>Income Tax Withheld ({project.levies.isFiler ? "Filer" : "Non-filer"})</Td>
                  <Td className="text-right tabular">− {formatPKR(bid.incomeTaxAmount)}</Td>
                </tr>
                <tr className="border-b border-neutral-200 font-semibold">
                  <Td>Net Receipt</Td>
                  <Td className="text-right tabular">{formatPKR(bid.netReceipt)}</Td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <Td>Bid Security @ {percent(project.levies.bidSecurity, 1)}</Td>
                  <Td className="text-right tabular">{formatPKR(bid.bidSecurityAmount)}</Td>
                </tr>
                <tr className="border-b border-neutral-200">
                  <Td>Performance Guarantee @ {percent(project.levies.performanceGuarantee, 1)}</Td>
                  <Td className="text-right tabular">{formatPKR(bid.performanceGuaranteeAmount)}</Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-10 text-[11px]">
          <Sign label="Prepared by (Estimator)" />
          <Sign label="Authorized Signature & Stamp" />
        </div>
        <p className="mt-6 text-center text-[9px] text-neutral-400">
          Prepared with MSC Estimating · This bid build-up is indicative and subject to verification
          against the governing {project.csrSchedule}. · Crafted by Tamoor Salman
        </p>
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense>
      <PrintInner />
    </Suspense>
  );
}

function Trade({ name, subtotal, children }: { name: string; subtotal: number; children: React.ReactNode }) {
  return (
    <>
      <tr className="bg-neutral-50">
        <td colSpan={7} className="border-y border-neutral-300 px-2 py-1 text-[11px] font-semibold uppercase">
          {name}
        </td>
      </tr>
      {children}
      <tr className="border-b border-neutral-300">
        <td colSpan={6} className="px-2 py-1 text-right text-[11px] font-semibold">
          Sub-total — {name}
        </td>
        <td className="px-2 py-1 text-right text-[11px] font-semibold tabular">{formatPKR(subtotal)}</td>
      </tr>
    </>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-2 py-1 font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 py-1 align-top ${className}`}>{children}</td>;
}
function MetaRow({ l1, v1, l2, v2 }: { l1: string; v1: string; l2: string; v2: string }) {
  return (
    <tr>
      <td className="w-24 border border-neutral-300 bg-neutral-50 px-2 py-1 font-semibold">{l1}</td>
      <td className="border border-neutral-300 px-2 py-1">{v1}</td>
      <td className="w-24 border border-neutral-300 bg-neutral-50 px-2 py-1 font-semibold">{l2}</td>
      <td className="border border-neutral-300 px-2 py-1">{v2}</td>
    </tr>
  );
}
function KmRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-neutral-200">
      <Td>{label}</Td>
      <Td className="text-right tabular">{value}</Td>
    </tr>
  );
}
function Sign({ label }: { label: string }) {
  return (
    <div>
      <div className="h-12 border-b border-black" />
      <div className="mt-1 text-neutral-600">{label}</div>
    </div>
  );
}
