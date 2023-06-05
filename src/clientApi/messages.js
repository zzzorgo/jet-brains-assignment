export const loadMessages = async (offset, size = 10000) => {
  // todo: handle errors
  const resp = await fetch(`/api/messages?offset=${offset}&size=${size}`);
  const newMessages = await resp.json();

  return newMessages;
};
