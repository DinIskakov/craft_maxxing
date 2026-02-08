import BottomNav from './BottomNav'

export default function AppLayout({ children }) {
    return (
        <>
            {children}
            <BottomNav />
        </>
    )
}
