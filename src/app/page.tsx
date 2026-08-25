import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  GitCompareArrows,
  Layers3,
  Network,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";

const capabilities = [
  [BarChart3, "Spend Intelligence", "Expose cost, concentration, PPV and the long tail."],
  [ShieldCheck, "Supplier Evaluation", "Score cost, quality, delivery, reliability and risk."],
  [Layers3, "Total Cost Analysis", "Compare landed price with inventory, quality and delay cost."],
  [Calculator, "Should-Cost Modelling", "Build a defensible operation-level component cost."],
  [GitCompareArrows, "RFQ Comparison", "Normalize offers and separate lowest quote from best value."],
  [Network, "Sourcing Optimization", "Allocate demand within capacity, risk and concentration limits."],
  [SlidersHorizontal, "Scenario Planning", "Stress-test demand, freight, quality and capacity changes."],
] as const;

export default function LandingPage() {
  return (
    <main className="landing-shell">
      <nav className="landing-nav" aria-label="Primary navigation">
        <Logo />
        <div className="landing-links">
          <Link href="#capabilities">Capabilities</Link>
          <Link href="/methodology">Methodology</Link>
          <Link href="/about">About</Link>
          <Link href="/workspace/overview" className="button button-small button-primary">Open workspace <ArrowRight size={15} /></Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Strategic Procurement &amp; Cost Intelligence</span>
          <h1>Turn procurement data into <em>better sourcing decisions.</em></h1>
          <p>Analyse spend, evaluate suppliers, model should-cost, compare RFQs and optimize sourcing strategies through an explainable procurement decision engine.</p>
          <div className="hero-actions">
            <Link href="/workspace/overview" className="button button-primary">Open Demo Workspace <ArrowRight size={17} /></Link>
            <Link href="#workflow" className="button button-secondary">See how it works</Link>
          </div>
          <div className="trust-row" role="list" aria-label="Platform principles">
            <span role="listitem"><Check size={14} /> No API keys</span>
            <span role="listitem"><Check size={14} /> Local workspace</span>
            <span role="listitem"><Check size={14} /> Explainable calculations</span>
          </div>
        </div>
        <div className="hero-visual" role="img" aria-label="Illustration of supplier choices converging into a sourcing decision">
          <div className="hero-visual-head">
            <span>Decision brief</span>
            <span className="status status-positive">Model complete</span>
          </div>
          <div className="decision-flow">
            <div className="supplier-options">
              <div><span>A</span><b>₹1,184</b><small>Lowest quote</small></div>
              <div className="recommended"><span>B</span><b>₹1,207</b><small>Best evaluated cost</small></div>
              <div><span>C</span><b>₹1,226</b><small>Capacity reserve</small></div>
            </div>
            <div className="decision-connector" aria-hidden="true"><span /><span /><span /></div>
            <div className="decision-output">
              <div className="decision-check"><Check size={22} /></div>
              <div><small>Recommended strategy</small><strong>Dual source</strong><p>65% Supplier B · 35% Supplier C</p></div>
            </div>
          </div>
          <div className="visual-metrics">
            <div><small>Expected annual value</small><strong>₹18.7 L</strong></div>
            <div><small>Concentration reduced</small><strong>−27%</strong></div>
            <div><small>Decision confidence</small><strong>High</strong></div>
          </div>
        </div>
      </section>

      <section className="capability-section" id="capabilities">
        <div className="section-intro">
          <span className="eyebrow">One decision workspace</span>
          <h2>Analysis designed to end in an action.</h2>
          <p>Each module connects procurement evidence to a defensible commercial or sourcing recommendation.</p>
        </div>
        <div className="capability-grid">
          {capabilities.map(([Icon, title, description]) => (
            <article key={title}>
              <Icon size={20} />
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="price-section">
        <div>
          <span className="eyebrow eyebrow-light">Decision economics</span>
          <h2>Price is only one part of procurement cost.</h2>
        </div>
        <p>A lower quotation can be erased by freight, defects, inventory, delayed delivery, constrained capacity and poor payment terms. ProcureIQ makes those trade-offs visible and comparable.</p>
        <div className="cost-strip">
          {["Quoted price", "Freight", "Quality", "Inventory", "Lead time", "Capacity", "Risk", "Payment terms"].map((item, index) => <span key={item}><b>{String(index + 1).padStart(2, "0")}</b>{item}</span>)}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="section-intro centered">
          <span className="eyebrow">Structured workflow</span>
          <h2>From transaction data to a management decision.</h2>
        </div>
        <div className="workflow-row">
          {["Data", "Analyse", "Compare", "Optimize", "Decide"].map((step, index) => (
            <div key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong>{index < 4 ? <ArrowRight aria-hidden="true" /> : null}</div>
          ))}
        </div>
      </section>

      <section className="transparency-section">
        <div className="section-intro">
          <span className="eyebrow">Transparent by design</span>
          <h2>Intelligence you can explain.</h2>
        </div>
        <div className="transparency-grid">
          <div><strong>Deterministic analytics</strong><p>Scores and recommendations are calculated from documented formulas—not generated text.</p></div>
          <div><strong>Private local workspace</strong><p>Imported procurement data is stored in this browser, not in a ProcureIQ production database.</p></div>
          <div><strong>No external AI dependency</strong><p>The complete product works without paid APIs, secrets or remote optimization services.</p></div>
        </div>
      </section>

      <footer className="landing-footer">
        <Logo />
        <p>ProcureIQ is a portfolio project built using a fictional manufacturing dataset for procurement analytics and sourcing decision modelling.</p>
        <div><Link href="/about">About</Link><Link href="/about/architecture">Architecture</Link><Link href="/methodology">Methodology</Link></div>
      </footer>
    </main>
  );
}
