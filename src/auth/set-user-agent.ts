import Shopify from '@shopify/shopify-api';

export const EXPRESS_USER_AGENT_PREFIX = 'EXPRESS Shopify Auth';

export default function setUserAgent() {
  if (!Shopify.Context.USER_AGENT_PREFIX) {
    Shopify.Context.USER_AGENT_PREFIX = EXPRESS_USER_AGENT_PREFIX;
  } else if (!Shopify.Context.USER_AGENT_PREFIX.includes(EXPRESS_USER_AGENT_PREFIX)) {
    Shopify.Context.USER_AGENT_PREFIX = `${Shopify.Context.USER_AGENT_PREFIX} | ${EXPRESS_USER_AGENT_PREFIX}`;
  }
}
