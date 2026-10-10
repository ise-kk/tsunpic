// 線のアイコン(色は文字色に合わせる)
type P = { size?: number }

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
})

export const IconBack = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
)
export const IconClose = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)
export const IconPhotos = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 16l5-5 4 4 3-3 6 6" />
  </svg>
)
export const IconCamera = ({ size = 20 }: P) => (
  <svg {...base(size)}>
    <path d="M3 8h4l2-3h6l2 3h4v11H3z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
)
export const IconMore = ({ size = 22 }: P) => (
  <svg {...base(size)}>
    <circle cx="5" cy="12" r="1.2" />
    <circle cx="12" cy="12" r="1.2" />
    <circle cx="19" cy="12" r="1.2" />
  </svg>
)
export const IconChevronLeft = ({ size = 28 }: P) => (
  <svg {...base(size)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)
export const IconChevronRight = ({ size = 28 }: P) => (
  <svg {...base(size)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)
export const IconLock = ({ size = 18 }: P) => (
  <svg {...base(size)}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
export const IconEdit = ({ size = 16 }: P) => (
  <svg {...base(size)}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </svg>
)
