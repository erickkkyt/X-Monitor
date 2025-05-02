import Header from '../components/Header';
import Hero from '../components/Hero';
import Features from '../components/Features';
import WhatIs from '../components/WhatIs';
import HowTo from '../components/HowTo';
import Why from '../components/Why';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <Hero />
        <Features />
        <WhatIs />
        <HowTo />
        <Why />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
