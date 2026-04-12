export interface PlatformSelector {
  url: string;
  searchParam: string;
  pagination: 'load-more' | 'page-number';
  selectors: {
    jobList: string;
    title: string;
    company: string;
    location: string;
    url: string;
  };
}

export type PlatformName = 'glints' | 'jobstreet' | 'linkedin';

export const platformSelectors: Record<PlatformName, PlatformSelector> = {
  glints: {
    url: 'https://glints.com/id/opportunities/jobs',
    searchParam: 'query',
    pagination: 'load-more',
    selectors: {
      jobList: 'article[aria-label^="Job:"]',
      title: '@aria:job',
      company: '@aria:job',
      location: '@aria:job',
      url: 'a[href*="/id/opportunities/"]@href',
    },
  },
  jobstreet: {
    url: 'https://www.jobstreet.com/id/jobs',
    searchParam: 'keywords',
    pagination: 'page-number',
    selectors: {
      jobList: '[data-automation="jobListingCard"]',
      title: '[data-automation="jobTitle"]',
      company: '[data-automation="companyName"]',
      location: '[data-automation="location"]',
      url: 'a[data-automation="jobTitle"]@href',
    },
  },
  linkedin: {
    url: 'https://www.linkedin.com/jobs/search',
    searchParam: 'keywords',
    pagination: 'page-number',
    selectors: {
      jobList: '.job-card-container',
      title: '.job-card-list__title',
      company: '.job-card-container__company-name',
      location: '.job-card-container__metadata',
      url: 'a.job-card-list__title@href',
    },
  },
};