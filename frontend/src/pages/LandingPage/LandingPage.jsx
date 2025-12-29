import React from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";

// ---------- DATA ----------
const features = [
    {
        title: "Inventory management",
        text: "Unified catalog with prices, barcodes and categories. Minimum stock levels and controlled stock intake."
    },
    {
        title: "Fast sales (POS)",
        text: "Cashier workspace: search or scan items, build a receipt and complete payment in a few steps."
    },
    {
        title: "Stock control",
        text: "Up-to-date stock levels per warehouse and store. All movements are recorded in an audit trail."
    },
    {
        title: "Owner analytics",
        text: "Sales reports by day, week and month. See top-performing items and where stockouts appear."
    }
];

// ---------- STYLES ----------
const Root = styled.div`
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color: #0f172a;
  background: #f8fafc;
  min-height: 100vh;
`;

const Hero = styled.section`
  padding: 56px 16px 40px;
  background: radial-gradient(circle at top left, #0ea5e9 0, #0369a1 40%, #020617 100%);
  color: #f9fafb;
`;

const HeroInner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 2fr);
  gap: 32px;
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const HeroMain = styled.div`
  max-width: 640px;
`;

const HeroTitle = styled.h1`
  font-size: 34px;
  line-height: 1.1;
  font-weight: 800;
  margin: 0 0 16px;

  span {
    color: #e0f2fe;
  }

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const HeroSubtitle = styled.p`
  margin: 0 0 24px;
  font-size: 16px;
  line-height: 1.5;
  color: #e2e8f0;
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ButtonBase = styled.button`
  border-radius: 999px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: 0.15s ease;
`;

const BtnPrimary = styled(ButtonBase)`
  background: #f59e0b;
  color: #111827;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.35);

  &:hover {
    background: #f97316;
    transform: translateY(-1px);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.45);
  }
`;

const BtnSecondary = styled(ButtonBase)`
  background: rgba(15, 23, 42, 0.15);
  color: #e5e7eb;
  border: 1px solid rgba(148, 163, 184, 0.7);

  &:hover {
    background: rgba(15, 23, 42, 0.35);
  }
`;

const HeroNote = styled.p`
  margin: 4px 0 0;
  font-size: 13px;
  color: #cbd5f5;
`;

// --- Right panel ---
const HeroPanel = styled.div`
  display: flex;
  justify-content: flex-end;

  @media (max-width: 900px) {
    justify-content: flex-start;
  }
`;

const PanelCard = styled.div`
  max-width: 320px;
  width: 100%;
  background: rgba(15, 23, 42, 0.82);
  border-radius: 20px;
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.6);
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const PanelLabel = styled.span`
  font-size: 13px;
  color: #9ca3af;
`;

const PanelValue = styled.span`
  font-size: 24px;
  font-weight: 800;
  color: #f9fafb;
`;

const PanelRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
  color: #e5e7eb;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);

  &:last-of-type {
    border-bottom: none;
    margin-bottom: 6px;
  }
`;

const Pill = styled.span`
  font-size: 11px;
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
  padding: 2px 8px;
  border-radius: 999px;
`;

// ========== SECTIONS ==========
const Section = styled.section`
  max-width: 1120px;
  margin: 0 auto;
  padding: 32px 16px 12px;
`;

const SectionHeader = styled.div`
  max-width: 640px;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 22px;
  margin: 0 0 8px;
  font-weight: 700;
`;

const SectionSubtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: #64748b;
`;

const FeaturesGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, 1fr);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureCard = styled.div`
  background: #fff;
  border-radius: 14px;
  padding: 14px 16px;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
  border: 1px solid rgba(148, 163, 184, 0.25);
`;

const FeatureTitle = styled.h3`
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
`;

const FeatureText = styled.p`
  margin: 0;
  font-size: 13px;
  color: #4b5563;
`;

// FOOTNOTE
const SectionMuted = styled(Section)`
  padding-bottom: 40px;
`;

const Footnote = styled.div`
  background: #e5f3ff;
  border-radius: 16px;
  padding: 16px 18px;
  border: 1px solid #bfdbfe;

  h3 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #1e293b;
  }
`;

// ---------- COMPONENT ----------
export default function LandingPage() {
    const { setActivePage } = usePage();

    return (
        <Root>
            <Hero>
                <HeroInner>
                    {/* LEFT */}
                    <HeroMain>
                        <HeroTitle>
                            Inventory information system<br />
                            <span>for retail stock and sales</span>
                        </HeroTitle>

                        <HeroSubtitle>
                            One interface for products, warehouses, sales and analytics.
                            The system was initially built as a diploma project and models real retail processes.
                        </HeroSubtitle>

                        <Actions>
                            <BtnPrimary onClick={() => setActivePage("login")}>
                                Sign in
                            </BtnPrimary>

                            <BtnSecondary onClick={() => setActivePage("register")}>
                                Register a store
                            </BtnSecondary>
                        </Actions>

                        <HeroNote>
                            After signing in you'll get access to <b>Products</b>, <b>Warehouse</b>,{" "}
                            <b>Sales</b> and <b>Reports</b> modules.
                        </HeroNote>
                    </HeroMain>

                    {/* RIGHT PANEL */}
                    <HeroPanel>
                        <PanelCard>
                            <PanelHeader>
                                <PanelLabel>Today</PanelLabel>
                                <PanelValue>₸ 0</PanelValue>
                            </PanelHeader>

                            <PanelRow>
                                <span>Sales today</span>
                                <Pill>awaiting backend</Pill>
                            </PanelRow>

                            <PanelRow>
                                <span>Products in catalog</span>
                                <span>—</span>
                            </PanelRow>

                            <PanelRow>
                                <span>Low stock items</span>
                                <span>—</span>
                            </PanelRow>

                            <PanelRow>
                                <span>Analytics refresh</span>
                                <span>—</span>
                            </PanelRow>
                        </PanelCard>
                    </HeroPanel>
                </HeroInner>
            </Hero>

            {/* FEATURES */}
            <Section>
                <SectionHeader>
                    <SectionTitle>What the system can do</SectionTitle>
                    <SectionSubtitle>
                        The architecture is built around a core of inventory: catalog, stock movements, sales and analytics.
                    </SectionSubtitle>
                </SectionHeader>

                <FeaturesGrid>
                    {features.map((f) => (
                        <FeatureCard key={f.title}>
                            <FeatureTitle>{f.title}</FeatureTitle>
                            <FeatureText>{f.text}</FeatureText>
                        </FeatureCard>
                    ))}
                </FeaturesGrid>
            </Section>

            {/* FOOTNOTE */}
            <SectionMuted>
                <Footnote>
                    <h3>About the project</h3>
                    <p>
                        This system was created as a diploma project. Interfaces for products,
                        warehouse and sales are implemented. The next step is a full backend
                        (REST API, authentication, analytics).
                    </p>
                </Footnote>
            </SectionMuted>
        </Root>
    );
}
