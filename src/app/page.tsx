'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Sun,
  Zap,
  Shield,
  Leaf,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  MonitorSmartphone,
  Banknote,
  FileCheck,
  Wrench,
  IndianRupee,
  Eye,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
}

const steps = [
  {
    step: 1,
    title: 'Apply Online',
    description:
      'Fill out a simple application form with your details and energy requirements. Our team will review it within 24 hours.',
    icon: FileCheck,
  },
  {
    step: 2,
    title: 'Site Assessment',
    description:
      'Our expert engineers visit your site to assess solar potential, roof condition, and design the optimal system for you.',
    icon: Eye,
  },
  {
    step: 3,
    title: 'Installation',
    description:
      'Professional installation by certified technicians with minimal disruption. Most installations complete within 2-3 days.',
    icon: Wrench,
  },
  {
    step: 4,
    title: 'Start Saving',
    description:
      'Watch your electricity bills drop significantly. Start generating clean energy and saving money from day one.',
    icon: TrendingUp,
  },
]

const features = [
  {
    title: 'On-Grid & Off-Grid',
    description:
      'Choose between grid-connected systems with net metering or independent off-grid solutions for remote locations.',
    icon: Zap,
  },
  {
    title: 'Government Subsidies',
    description:
      'We handle all paperwork for PM Surya Ghar Yojana and state subsidies, helping you save on installation costs.',
    icon: IndianRupee,
  },
  {
    title: 'Easy Financing',
    description:
      'Affordable EMI options with partner banks. Zero down payment options available to make solar accessible for everyone.',
    icon: Banknote,
  },
  {
    title: '25 Year Warranty',
    description:
      'Industry-leading warranty on solar panels and comprehensive coverage on inverters, batteries, and all components.',
    icon: Shield,
  },
  {
    title: 'Real-time Monitoring',
    description:
      'Monitor your solar system performance anytime through our portal. Track energy generation, savings, and CO₂ offset.',
    icon: MonitorSmartphone,
  },
  {
    title: 'Eco-friendly',
    description:
      'Reduce your carbon footprint significantly. Each residential system prevents approximately 4-5 tonnes of CO₂ emissions annually.',
    icon: Leaf,
  },
]

const faqs = [
  {
    question: 'How much does a residential solar system cost?',
    answer:
      'The cost of a residential solar system depends on the capacity and type (on-grid, off-grid, or hybrid). Contact us or apply online to get a detailed quote tailored to your requirements. Government subsidies under PM Surya Ghar Yojana can significantly reduce your effective cost.',
  },
  {
    question: 'How long does installation take?',
    answer:
      'Most residential installations are completed within 2-3 days. This includes panel mounting, inverter setup, and grid connection. The entire process from application to commissioning typically takes 2-4 weeks, including site assessment and subsidy approvals.',
  },
  {
    question: 'What is net metering and how does it benefit me?',
    answer:
      'Net metering allows you to sell excess solar energy back to the grid. Your meter runs backwards when you export energy, effectively reducing your electricity bill. In many cases, you can earn credits that offset your nighttime consumption, leading to near-zero electricity bills.',
  },
  {
    question: 'What warranty and maintenance do you provide?',
    answer:
      'We provide a 25-year performance warranty on solar panels, 10-year warranty on inverters, and 5-year warranty on batteries. Our maintenance contracts include system health checks, panel cleaning, and performance optimization.',
  },
  {
    question: 'Can I get a solar system if I live in an apartment?',
    answer:
      'Yes! We offer community solar solutions for apartment complexes and housing societies. Residents can collectively invest in a shared rooftop system and benefit from reduced electricity costs based on their share of the investment.',
  },
]

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-foreground/5 dark:via-foreground/3 dark:to-foreground/5">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                <Sun className="h-4 w-4" />
                India&apos;s Trusted Solar Partner
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Power Your Home with{' '}
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Solar Energy
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl"
            >
              Save up to 90% on electricity bills while reducing your carbon
              footprint. Diamond Solar makes the switch to clean energy simple,
              affordable, and hassle-free.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button size="lg" className="gap-2 px-8 text-base" asChild>
                <Link href="/application">
                  Apply Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 px-8 text-base"
                asChild
              >
                <Link href="#how-it-works">
                  Learn More
                  <ChevronDown className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mt-12 flex flex-col items-center justify-center gap-3 text-xs sm:flex-row sm:gap-6 sm:text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                Free Site Assessment
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                Subsidy Assistance
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-primary" />
                25 Year Warranty
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              How It Works
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Go Solar in 4 Simple Steps
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              From application to savings, we make the entire process seamless
              and transparent.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {steps.map((step) => {
              const Icon = step.icon
              return (
                <motion.div key={step.step} variants={fadeInUp}>
                  <Card className="relative h-full border-primary/10 transition-shadow hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                          {step.step}
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Why Choose Us
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Everything You Need for Solar
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive solar solutions backed by expertise, quality, and
              reliable support.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={fadeInUp}>
                  <Card className="h-full border-primary/10 transition-all hover:border-primary/25 hover:shadow-md">
                    <CardContent className="p-6">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-primary via-amber-600 to-orange-600">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Switch to Solar?
            </h2>
            <p className="mt-4 text-lg text-white/85">
              Apply for your solar installation today and start generating clean
              energy. We handle everything from site assessment to installation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2 px-8 text-base font-semibold"
                asChild
              >
                <Link href="/application">
                  Apply for Solar Installation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 px-8 text-base border-white/30 text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link href="/support">
                  Talk to an Expert
                </Link>
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/70">
              Free consultation &bull; No obligation &bull; Subsidy assistance
              included
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-24 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="mx-auto max-w-2xl text-center"
          >
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              FAQ
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Got questions? We&apos;ve got answers. Find everything you need to
              know about going solar.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={fadeInUp}
            className="mx-auto mt-12 max-w-3xl"
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:text-primary sm:text-base">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
