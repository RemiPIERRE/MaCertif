import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9.5 10 3l7 6.5" />
      <path d="M5 8.5V17h10V8.5" />
      <path d="M8 17v-5h4v5" />
    </svg>
  )
}

export function IconDossier(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M5 2.5h7l3 3V17.5H5z" />
      <path d="M12 2.5V6h3" />
      <path d="M7.5 10.5h5M7.5 13.5h5" />
    </svg>
  )
}

export function IconSite(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="4" width="15" height="12" rx="1.4" />
      <path d="M2.5 7.3h15" />
      <path d="M5 5.6h.01M7 5.6h.01" />
    </svg>
  )
}

export function IconOral(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.2" />
      <path d="M7 17h6" />
      <path d="M10 13.5V17" />
      <path d="M6 10.5l2.2-3 2 2L14 6.5" />
    </svg>
  )
}

export function IconNotes(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M4 3h9l3 3v11H4z" />
      <path d="M13 3v3h3" />
      <path d="M7 9.5h6M7 12.5h6" />
    </svg>
  )
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4.2" width="14" height="12.8" rx="1.4" />
      <path d="M3 8h14" />
      <path d="M6.5 2.5v3M13.5 2.5v3" />
    </svg>
  )
}

export function IconSun(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <circle cx="10" cy="10" r="3.4" />
      <path d="M10 2.6v1.8M10 15.6v1.8M17.4 10h-1.8M4.4 10H2.6M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3M15.2 15.2l-1.3-1.3M6.1 6.1 4.8 4.8" />
    </svg>
  )
}

export function IconMoon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M16.5 12.3A6.8 6.8 0 0 1 7.7 3.5a7 7 0 1 0 8.8 8.8z" />
    </svg>
  )
}
