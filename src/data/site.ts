export const site = {
  name: 'Harkingbade',
  shortName: 'HB',
  url: 'https://harkingbade.com',
  title: 'Harkingbade — Product & Growth Systems Builder',
  description:
    'Product strategy, positioning, growth, content, and hands-on web delivery for digital products people choose.',
  email: 'hello@harkingbade.com',
  locale: 'en_CA',
  language: 'en',
} as const;

export const navigation = [
  { label: 'Work', href: '/work/' },
  { label: 'Services', href: '/services/' },
  { label: 'Insights', href: '/insights/' },
  { label: 'Lab', href: '/lab/' },
  { label: 'About', href: '/about/' },
] as const;

export const systemStages = [
  {
    number: '01',
    name: 'Discover',
    short: 'Find the real opportunity.',
    description: 'Customer research, market context, analytics, and opportunity definition.',
  },
  {
    number: '02',
    name: 'Define',
    short: 'Make the choices clear.',
    description: 'Product strategy, prioritization, positioning, offer, and success measures.',
  },
  {
    number: '03',
    name: 'Deliver',
    short: 'Turn strategy into something real.',
    description: 'Experience, content, web and ecommerce implementation, and launch operations.',
  },
  {
    number: '04',
    name: 'Drive',
    short: 'Build a learning growth loop.',
    description: 'Distribution, social, SEO, lifecycle, experiments, and conversion.',
  },
] as const;
