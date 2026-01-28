import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-1000">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-foreground mb-6 text-balance">
          CraftMaxxing
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-16 max-w-md mx-auto text-pretty">
          Master any skill in 30 days with personalized daily tasks designed just for you.
        </p>
      </div>
      
      <div className="fixed bottom-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <Link
          to="/setup"
          className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-medium transition-all hover:gap-5 hover:shadow-lg"
        >
          Get Started
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </main>
  )
}
