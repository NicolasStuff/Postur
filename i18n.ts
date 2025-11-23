import {getRequestConfig} from 'next-intl/server';
 
export default getRequestConfig(async () => {
  // Provide a static locale for now
  const locale = 'fr';
 
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
