import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart2,
  CheckCircle,
  ChevronRight,
  Clock,
  Mic,
  QrCode,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { motion } from "motion/react";
import type { AppPage } from "../hooks/useAuth";

interface LandingPageProps {
  onNavigate: (page: AppPage) => void;
}

const features = [
  {
    icon: <Activity className="w-6 h-6" />,
    title: "Real-time Queue Tracking",
    desc: "Monitor queue position and status updates as they happen, no refreshing needed.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "ETA Waiting Prediction",
    desc: "Accurate waiting time estimates based on average consultation durations.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Announcements",
    desc: "Clear audio announcements when your token is called, never miss your turn.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: "Smart Missed Token Recovery",
    desc: "60-second response window with options to confirm, delay, or cancel.",
    color: "text-rose-400",
    bg: "bg-rose-400/10",
  },
  {
    icon: <Stethoscope className="w-6 h-6" />,
    title: "Doctor Selection",
    desc: "Choose your preferred doctor or request a new specialist to be added.",
    color: "text-teal-400",
    bg: "bg-teal-400/10",
  },
  {
    icon: <QrCode className="w-6 h-6" />,
    title: "QR Walk-in Support",
    desc: "Scan and register instantly via QR code at the clinic entrance.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
];

const steps = [
  {
    num: "01",
    title: "Get Your Token",
    desc: "Select a doctor, enter your name, and generate a digital token in seconds.",
    icon: <ChevronRight className="w-5 h-5" />,
  },
  {
    num: "02",
    title: "Track the Queue",
    desc: "Watch your position update in real-time. See your exact ETA countdown.",
    icon: <BarChart2 className="w-5 h-5" />,
  },
  {
    num: "03",
    title: "Get Called",
    desc: "Receive a notification with voice announcement when it's your turn.",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, oklch(0.11 0.03 255) 0%, oklch(0.09 0.02 260) 40%, oklch(0.10 0.03 240) 100%)",
      }}
    >
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-navy-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-teal flex items-center justify-center shadow-teal">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold font-display gradient-text">
            ToknFlow
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it Works
          </a>
          <a
            href="#get-token"
            className="hover:text-foreground transition-colors"
          >
            Get Token
          </a>
        </div>

        <Button
          className="bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 border border-teal-500/30 font-semibold"
          onClick={() => onNavigate("auth")}
          data-ocid="nav.login_button"
        >
          Login
        </Button>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "url('/assets/generated/hero-bg.dim_1920x1080.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient orbs */}
        <div
          className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-blob"
          style={{ background: "oklch(0.72 0.18 195)" }}
        />
        <div
          className="absolute bottom-20 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl animate-blob"
          style={{
            background: "oklch(0.68 0.22 165)",
            animationDelay: "3s",
          }}
        />
        <div
          className="absolute top-1/2 right-10 w-64 h-64 rounded-full opacity-10 blur-3xl animate-blob"
          style={{
            background: "oklch(0.75 0.19 75)",
            animationDelay: "6s",
          }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 bg-teal-400/10 border border-teal-400/20 px-4 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-pulse" />
              Digital Token Management System
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6"
          >
            <span className="gradient-text-hero">Smart Doctor</span>
            <br />
            <span className="text-foreground/90">Queue System</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Skip the waiting room chaos. Get a digital token, track your
            position in real-time, and get notified the moment your doctor is
            ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            id="get-token"
          >
            <Button
              size="lg"
              className="gradient-teal text-white font-bold px-8 h-13 rounded-xl btn-glow text-base group"
              onClick={() => onNavigate("auth")}
              data-ocid="landing.get_token_button"
            >
              Get Your Token
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/15 text-foreground hover:bg-white/5 h-13 px-8 rounded-xl text-base"
              onClick={() => onNavigate("auth")}
            >
              Sign In
            </Button>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex items-center justify-center gap-8 mt-14"
          >
            {[
              { val: "60s", label: "Recovery Window" },
              { val: "Real-time", label: "Queue Updates" },
              { val: "3 Roles", label: "Patient · Doctor · Admin" },
            ].map(({ val, label }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold font-display gradient-text">
                  {val}
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            A complete queue management system built for modern healthcare
            facilities.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              className="glass rounded-2xl p-6 card-hover group"
            >
              <div
                className={`w-12 h-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
              >
                {f.icon}
              </div>
              <h3 className="font-bold font-display text-base mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-20 px-6"
        style={{ background: "oklch(0.11 0.025 250 / 50%)" }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-3">
              How It Works
            </h2>
            <p className="text-muted-foreground">
              Simple as 1-2-3. No app download required.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                variants={cardVariants}
                className="relative text-center"
              >
                <div className="glass rounded-2xl p-6 card-hover h-full">
                  <div className="w-12 h-12 rounded-full gradient-teal flex items-center justify-center mx-auto mb-4 shadow-teal">
                    <span className="text-white font-bold font-mono text-sm">
                      {step.num}
                    </span>
                  </div>
                  <h3 className="font-bold font-display text-base mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
                {idx < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/3 -right-3 z-10 text-teal-400/40">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center glass rounded-3xl p-12"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.72 0.18 195 / 10%), oklch(0.68 0.22 165 / 10%))",
            border: "1px solid oklch(0.72 0.18 195 / 20%)",
          }}
        >
          <h2 className="text-3xl font-bold font-display mb-3">
            Ready to Skip the Wait?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of patients who use ToknFlow to manage their clinic
            visits smarter.
          </p>
          <Button
            size="lg"
            className="gradient-teal text-white font-bold px-10 h-13 rounded-xl btn-glow text-base"
            onClick={() => onNavigate("auth")}
            data-ocid="landing.get_token_button"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg gradient-teal flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold font-display gradient-text">
              ToknFlow
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Smart Queue Management for Modern Healthcare
          </p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-teal-400 transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
