import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useAuth } from "../lib/auth-context"

export default function LandingPage() {
  const { user, loading } = useAuth()

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Auth buttons in top-right corner */}
      <div className="fixed top-6 right-6 flex items-center gap-4 animate-in fade-in duration-500">
        {!loading && !user && (
          <>
            <Link
              to="/login"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
        {!loading && user && (
          <Link
            to="/setup"
            className="bg-stone-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="max-w-2xl mx-auto text-center animate-in fade-in duration-1000">
        <h1 className="font-serif text-5xl md:text-7xl tracking-tight text-foreground mb-6 text-balance">
          SkillMaxxing
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-16 max-w-md mx-auto text-pretty">
          Master any skill in 30 days with personalized daily tasks designed just for you.
        </p>
      </div>

      <div className="fixed bottom-12 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
        <Link
          to={user ? "/setup" : "/signup"}
          className="group flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-full text-lg font-medium transition-all hover:gap-5 hover:shadow-lg"
        >
          Get Started
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </main>
  )
}
