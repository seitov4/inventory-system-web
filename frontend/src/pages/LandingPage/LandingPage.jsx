import React, { useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { usePage } from "../../context/PageContext";
import { useAuth } from "../../context/AuthContext";
import productsApi from "../../api/productsApi";
import salesApi from "../../api/salesApi";
import movementsApi from "../../api/movementsApi";
import notificationsApi from "../../api/notificationsApi";

const roleProfiles = {
    cashier: {
        label: "Cashier",
        title: "Start the shift from one useful screen",
        text: "Jump straight into POS, check catalog pressure and avoid losing time on decorative blocks.",
        actions: [
            { label: "Open POS", page: "pos", tone: "primary" },
            { label: "Products", page: "products" },
            { label: "Dashboard", page: "dashboard" },
        ],
        modules: [
            "POS workspace for active sales",
            "Product lookup before selling",
            "Quick route back into the dashboard",
        ],
    },
    manager: {
        label: "Manager",
        title: "Use landing as an operations brief",
        text: "Low stock, alerts and recent movements should be visible before you open warehouse flows.",
        actions: [
            { label: "Warehouse", page: "warehouse", tone: "primary" },
            { label: "Movements", page: "movements" },
            { label: "Products", page: "products" },
        ],
        modules: [
            "Warehouse control and intake",
            "Movement audit trail",
            "Catalog pressure review",
        ],
    },
    owner: {
        label: "Owner",
        title: "See the signal before you open reports",
        text: "Sales, alerts and stock pressure make this page a morning briefing instead of a promo screen.",
        actions: [
            { label: "Reports", page: "reports", tone: "primary" },
            { label: "Dashboard", page: "dashboard" },
            { label: "Notifications", page: "notifications" },
        ],
        modules: [
            "Sales visibility for the day",
            "Risk areas in stock and alerts",
            "Fast jump into reports or products",
        ],
    },
    admin: {
        label: "Admin",
        title: "Keep setup tied to real system context",
        text: "Staff setup and settings are more useful when you see current stock and analytics first.",
        actions: [
            { label: "Reports", page: "reports", tone: "primary" },
            { label: "Add employee", page: "addEmployee" },
            { label: "Settings", page: "settings" },
        ],
        modules: [
            "Admin overview with real numbers",
            "Direct route into employee setup",
            "Settings grounded in current activity",
        ],
    },
};

const guestSteps = [
    "Create or sign in to the owner account.",
    "Prepare products, price, barcode and minimum stock data.",
    "Define warehouses or store locations before sales begin.",
    "Use POS and reports only after stock structure is ready.",
];

const guestModules = [
    "Catalog and stock records",
    "Warehouse intake and transfers",
    "POS sales and receipts",
    "Reports and low-stock signals",
];

const formatNumber = (value) => new Intl.NumberFormat("ru-RU").format(Number(value) || 0);
const formatMoney = (value) =>
    new Intl.NumberFormat("ru-RU", {
        style: "currency",
        currency: "KZT",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

function formatTime(value) {
    if (!value) return "not refreshed";
    return new Date(value).toLocaleString("ru-RU", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getName(user) {
    const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
    return fullName || user?.store_name || user?.email || "team";
}

function movementLabel(type) {
    if (type === "IN") return "Stock in";
    if (type === "OUT") return "Stock out";
    if (type === "TRANSFER") return "Transfer";
    if (type === "SALE") return "Sale";
    if (type === "RETURN") return "Return";
    return type || "Movement";
}

async function fetchLandingData(role) {
    const canSeeAnalytics = role === "owner" || role === "admin";
    const canSeeNotifications = role === "manager" || role === "owner";
    const canSeeMovements = role === "manager" || role === "owner" || role === "admin";

    const [products, daily, monthly, notifications, movements] = await Promise.all([
        productsApi.getProductsLeft().catch(() => []),
        canSeeAnalytics ? salesApi.getDaily().catch(() => null) : Promise.resolve(null),
        canSeeAnalytics ? salesApi.getMonthly().catch(() => null) : Promise.resolve(null),
        canSeeNotifications
            ? notificationsApi.getAll({ status: "UNREAD", limit: 5 }).catch(() => [])
            : Promise.resolve([]),
        canSeeMovements
            ? movementsApi.getMovements({ limit: 5 }).catch(() => [])
            : Promise.resolve([]),
    ]);

    const catalog = Array.isArray(products) ? products : [];
    const lowStock = catalog.filter((item) => {
        const qty = Number(item.quantity ?? item.qty ?? 0);
        const min = Number(item.min_stock ?? 0);
        return min > 0 && qty <= min;
    });

    return {
        productsCount: catalog.length,
        lowStock,
        dailySales: Number(daily?.totalRevenue || 0),
        monthlySales: Array.isArray(monthly)
            ? monthly.reduce((sum, item) => sum + Number(item.total || 0), 0)
            : 0,
        notifications: Array.isArray(notifications) ? notifications : [],
        movements: Array.isArray(movements) ? movements : [],
        loadedAt: new Date().toISOString(),
    };
}

const Root = styled.div`
    min-height: 100%;
    color: var(--text-primary);
    background:
        radial-gradient(circle at top left, rgba(88, 166, 255, 0.16), transparent 28%),
        radial-gradient(circle at right top, rgba(251, 191, 36, 0.12), transparent 24%),
        linear-gradient(180deg, rgba(13, 17, 23, 0.96) 0, rgba(13, 17, 23, 0.98) 260px, var(--bg-primary) 260px);
`;

const Wrap = styled.div`
    max-width: 1180px;
    margin: 0 auto;
    padding: 36px 20px 32px;
`;

const Hero = styled.section`
    display: grid;
    grid-template-columns: minmax(0, 1.7fr) minmax(280px, 1fr);
    gap: 18px;
    margin-bottom: 28px;

    @media (max-width: 940px) {
        grid-template-columns: 1fr;
    }
`;

const Card = styled.div`
    background: ${(props) => props.$hero
        ? "linear-gradient(145deg, rgba(10, 36, 64, 0.82), rgba(17, 24, 39, 0.94))"
        : "var(--bg-card)"};
    border: 1px solid ${(props) => props.$hero ? "rgba(148, 163, 184, 0.22)" : "var(--border-color-subtle)"};
    border-radius: 24px;
    padding: ${(props) => props.$tight ? "18px" : "24px"};
    box-shadow: var(--shadow-card);
`;

const Eyebrow = styled.div`
    display: inline-flex;
    padding: 8px 12px;
    border-radius: 999px;
    background: rgba(96, 165, 250, 0.12);
    border: 1px solid rgba(96, 165, 250, 0.24);
    color: #bfdbfe;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const Title = styled.h1`
    margin: 16px 0 12px;
    font-size: clamp(2rem, 3vw, 3.2rem);
    line-height: 1;
    letter-spacing: -0.04em;
`;

const Accent = styled.span`
    color: #fbbf24;
`;

const Text = styled.p`
    margin: 0;
    color: ${(props) => (props.$light ? "#dbe7f5" : "var(--text-secondary)")};
    font-size: 15px;
    line-height: 1.65;
`;

const Actions = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 22px;
`;

const Button = styled.button`
    border: 1px solid ${(props) => (props.$primary ? "transparent" : "rgba(148, 163, 184, 0.35)")};
    background: ${(props) =>
        props.$primary
            ? "linear-gradient(135deg, #f59e0b, #f97316)"
            : "rgba(255, 255, 255, 0.04)"};
    color: ${(props) => (props.$primary ? "#111827" : "#e5eefc")};
    border-radius: 999px;
    padding: 12px 18px;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
`;

const Section = styled.section`
    margin-bottom: 28px;
`;

const Heading = styled.h2`
    margin: 0 0 8px;
    font-size: 28px;
    letter-spacing: -0.03em;
`;

const Subheading = styled.p`
    margin: 0 0 16px;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.6;
`;

const Grid = styled.div`
    display: grid;
    grid-template-columns: ${(props) => props.$metrics ? "repeat(4, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))"};
    gap: 16px;

    @media (max-width: 1080px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;

const TwoCol = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 16px;

    @media (max-width: 940px) {
        grid-template-columns: 1fr;
    }
`;

const Kicker = styled.div`
    color: var(--text-tertiary);
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
`;

const Value = styled.div`
    margin-top: 14px;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.04em;
`;

const List = styled.div`
    display: grid;
    gap: 12px;
`;

const ListButton = styled.button`
    width: 100%;
    text-align: left;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid var(--border-color);
    border-radius: 18px;
    padding: 16px;
    color: inherit;
    cursor: pointer;
`;

const ListItem = styled.div`
    padding: 14px 0;
    border-bottom: 1px dashed var(--border-color);

    &:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
`;

const Meta = styled.div`
    margin-top: 8px;
    color: var(--text-tertiary);
    font-size: 13px;
    line-height: 1.55;
`;

const Badge = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(96, 165, 250, 0.12);
    color: #93c5fd;
    font-size: 11px;
    font-weight: 700;
`;

const Status = styled.div`
    margin-top: 18px;
    color: ${(props) => (props.$error ? "#fca5a5" : "var(--text-tertiary)")};
    font-size: 13px;
`;

function AuthLanding({ user, role, setActivePage }) {
    const profile = roleProfiles[role] || roleProfiles.owner;
    const canSeeAnalytics = role === "owner" || role === "admin";
    const canSeeNotifications = role === "manager" || role === "owner";
    const canSeeMovements = role === "manager" || role === "owner" || role === "admin";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const next = await fetchLandingData(role);
                if (!cancelled) setData(next);
            } catch (e) {
                if (!cancelled) setError(e?.message || "Could not load landing data.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [role]);

    const metrics = useMemo(() => {
        const base = [
            {
                label: "Products in catalog",
                value: formatNumber(data?.productsCount || 0),
                text: "Live count from the product catalog.",
            },
            {
                label: "Low stock items",
                value: formatNumber(data?.lowStock?.length || 0),
                text: "Items at or below their minimum stock.",
            },
        ];

        if (canSeeAnalytics) {
            base.push(
                {
                    label: "Sales today",
                    value: formatMoney(data?.dailySales || 0),
                    text: "Current same-day revenue.",
                },
                {
                    label: "Sales this month",
                    value: formatMoney(data?.monthlySales || 0),
                    text: "Month-to-date revenue total.",
                }
            );
        } else if (canSeeNotifications) {
            base.push(
                {
                    label: "Unread alerts",
                    value: formatNumber(data?.notifications?.length || 0),
                    text: "Manager-owner notifications still waiting.",
                },
                {
                    label: "Recent stock events",
                    value: formatNumber(data?.movements?.length || 0),
                    text: "Fresh movement rows on this landing page.",
                }
            );
        } else {
            base.push(
                {
                    label: "Main workspace",
                    value: "POS",
                    text: "Fast route into cashier work.",
                },
                {
                    label: "Next step",
                    value: "Start shift",
                    text: "Open POS or products immediately.",
                }
            );
        }

        return base;
    }, [canSeeAnalytics, canSeeNotifications, data]);

    const focus = useMemo(() => {
        const items = [];
        const lowStockCount = data?.lowStock?.length || 0;
        const unreadCount = data?.notifications?.length || 0;
        const latestMovement = data?.movements?.[0];

        if (lowStockCount > 0) {
            items.push({
                title: `${lowStockCount} item(s) need stock attention`,
                text: "Use warehouse or products to resolve the most depleted positions first.",
                page: role === "cashier" ? "products" : "warehouse",
            });
        }

        if (canSeeNotifications && unreadCount > 0) {
            items.push({
                title: `${unreadCount} unread notification(s) waiting`,
                text: "Low-stock alerts should not stay hidden behind a menu.",
                page: "notifications",
            });
        }

        if (canSeeAnalytics) {
            items.push({
                title: data?.dailySales ? `Today's revenue is ${formatMoney(data.dailySales)}` : "No sales recorded today yet",
                text: "Use reports or dashboard to compare the day against the wider trend.",
                page: "reports",
            });
        }

        if (canSeeMovements && latestMovement) {
            items.push({
                title: `Latest event: ${movementLabel(latestMovement.type)}`,
                text: `${latestMovement.product_name || "Unknown product"} changed by ${formatNumber(latestMovement.quantity)} unit(s).`,
                page: "movements",
            });
        }

        if (!items.length) {
            items.push({
                title: "No urgent blockers on landing",
                text: "This page is clear, so move straight into your main workflow.",
                page: profile.actions[0].page,
            });
        }

        return items.slice(0, 4);
    }, [canSeeAnalytics, canSeeMovements, canSeeNotifications, data, profile.actions, role]);

    const sideItems = canSeeMovements ? data?.movements || [] : data?.lowStock || [];

    return (
        <Root>
            <Wrap>
                <Hero>
                    <Card $hero>
                        <Eyebrow>{profile.label} workspace</Eyebrow>
                        <Title>
                            {profile.title}
                            <br />
                            <Accent>{getName(user)}</Accent>
                        </Title>
                        <Text $light>{profile.text}</Text>
                        <Actions>
                            {profile.actions.map((action) => (
                                <Button
                                    key={action.label}
                                    $primary={action.tone === "primary"}
                                    onClick={() => setActivePage(action.page)}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </Actions>
                        <Status $error={!!error}>
                            {error
                                ? error
                                : loading
                                  ? "Preparing landing snapshot..."
                                  : `Updated ${formatTime(data?.loadedAt)}.`}
                        </Status>
                    </Card>

                    <Card $hero $tight>
                        <Kicker>Current role</Kicker>
                        <Value>{profile.label}</Value>
                        <Meta>{user?.store_name || "Store not set"}</Meta>
                        <List>
                            <ListItem>
                                <Kicker>Catalog size</Kicker>
                                <Meta>{formatNumber(data?.productsCount || 0)}</Meta>
                            </ListItem>
                            <ListItem>
                                <Kicker>Low stock pressure</Kicker>
                                <Meta>{formatNumber(data?.lowStock?.length || 0)}</Meta>
                            </ListItem>
                            {canSeeAnalytics ? (
                                <ListItem>
                                    <Kicker>Revenue today</Kicker>
                                    <Meta>{formatMoney(data?.dailySales || 0)}</Meta>
                                </ListItem>
                            ) : null}
                            {canSeeNotifications ? (
                                <ListItem>
                                    <Kicker>Unread alerts</Kicker>
                                    <Meta>{formatNumber(data?.notifications?.length || 0)}</Meta>
                                </ListItem>
                            ) : null}
                        </List>
                    </Card>
                </Hero>

                <Section>
                    <Heading>Today at a glance</Heading>
                    <Subheading>
                        The landing page now answers the first practical question: what matters right now for this role.
                    </Subheading>
                    <Grid $metrics>
                        {metrics.map((metric) => (
                            <Card key={metric.label}>
                                <Kicker>{metric.label}</Kicker>
                                <Value>{metric.value}</Value>
                                <Meta>{metric.text}</Meta>
                            </Card>
                        ))}
                    </Grid>
                </Section>

                <Section>
                    <TwoCol>
                        <Card>
                            <Heading style={{ fontSize: "22px", marginBottom: "8px" }}>
                                What deserves attention
                            </Heading>
                            <Subheading>
                                This block replaces empty marketing with concrete next actions.
                            </Subheading>
                            <List>
                                {focus.map((item) => (
                                    <ListButton key={item.title} onClick={() => setActivePage(item.page)}>
                                        <div style={{ fontWeight: 700, fontSize: "15px" }}>{item.title}</div>
                                        <Meta>{item.text}</Meta>
                                    </ListButton>
                                ))}
                            </List>
                        </Card>

                        <Card>
                            <Heading style={{ fontSize: "22px", marginBottom: "8px" }}>
                                {canSeeMovements ? "Recent activity" : "Stock pressure"}
                            </Heading>
                            <Subheading>
                                {canSeeMovements
                                    ? "Latest stock changes make the page feel operational."
                                    : "Even cashier-level landing can show where the catalog is under pressure."}
                            </Subheading>
                            {!sideItems.length ? (
                                <Meta>No fresh items to show here yet.</Meta>
                            ) : (
                                <List>
                                    {sideItems.slice(0, 5).map((item) => (
                                        <ListItem key={`${item.id || item.name}-${item.created_at || item.sku || "row"}`}>
                                            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                                                <div style={{ fontWeight: 700, fontSize: "14px" }}>
                                                    {canSeeMovements ? item.product_name || "Unknown product" : item.name}
                                                </div>
                                                <Badge>
                                                    {canSeeMovements
                                                        ? movementLabel(item.type)
                                                        : `${formatNumber(item.quantity ?? item.qty ?? 0)} left`}
                                                </Badge>
                                            </div>
                                            <Meta>
                                                {canSeeMovements
                                                    ? `${formatNumber(item.quantity)} unit(s) | ${formatTime(item.created_at)}`
                                                    : `Minimum stock ${formatNumber(item.min_stock || 0)}`}
                                            </Meta>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Card>
                    </TwoCol>
                </Section>

                <Section>
                    <Heading>Suggested routes from here</Heading>
                    <Subheading>
                        The start page should shorten the jump into work, not repeat what the menu already says.
                    </Subheading>
                    <Grid>
                        {profile.modules.map((text, index) => (
                            <Card key={text}>
                                <Kicker>Route {index + 1}</Kicker>
                                <Value style={{ fontSize: "22px", marginTop: "12px" }}>
                                    {profile.actions[index]?.label || "Open module"}
                                </Value>
                                <Meta>{text}</Meta>
                            </Card>
                        ))}
                    </Grid>
                </Section>
            </Wrap>
        </Root>
    );
}

function GuestLanding({ setActivePage }) {
    return (
        <Root>
            <Wrap>
                <Hero>
                    <Card $hero>
                        <Eyebrow>Retail inventory system</Eyebrow>
                        <Title>
                            Start with a page that
                            <br />
                            <Accent>explains the first setup</Accent>
                        </Title>
                        <Text $light>
                            This landing page now tells a new store what to do first instead of showing a generic project description.
                        </Text>
                        <Actions>
                            <Button $primary onClick={() => setActivePage("login")}>
                                Sign in
                            </Button>
                            <Button onClick={() => setActivePage("register")}>
                                Register a store
                            </Button>
                        </Actions>
                    </Card>

                    <Card $hero $tight>
                        <Kicker>Starter checklist</Kicker>
                        <Value>Before first launch</Value>
                        <List>
                            {guestSteps.map((step) => (
                                <ListItem key={step}>
                                    <Meta>{step}</Meta>
                                </ListItem>
                            ))}
                        </List>
                    </Card>
                </Hero>

                <Section>
                    <Heading>What the system is useful for</Heading>
                    <Subheading>
                        These blocks are framed around real operating work, not abstract feature marketing.
                    </Subheading>
                    <Grid>
                        {guestModules.map((item, index) => (
                            <Card key={item}>
                                <Kicker>Module {index + 1}</Kicker>
                                <Value style={{ fontSize: "22px", marginTop: "12px" }}>{item}</Value>
                            </Card>
                        ))}
                    </Grid>
                </Section>
            </Wrap>
        </Root>
    );
}

export default function LandingPage() {
    const { setActivePage } = usePage();
    const { user, role, isAuthenticated, status } = useAuth();

    if (status === "loading") {
        return (
            <Root>
                <Wrap>
                    <Card $hero>
                        <Eyebrow>Preparing workspace</Eyebrow>
                        <Title>Loading landing context</Title>
                        <Text $light>Checking the active session and selecting the right start screen.</Text>
                    </Card>
                </Wrap>
            </Root>
        );
    }

    return isAuthenticated ? (
        <AuthLanding user={user} role={role} setActivePage={setActivePage} />
    ) : (
        <GuestLanding setActivePage={setActivePage} />
    );
}
