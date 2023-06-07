export const fetchMessages = async (offset, size = 100) => {
  /**
   * we should always handle fetch errors in real life but for the sake of simplicity we will omit it here.
   * Ideally we should retry with exponential backoff while showing the loader to the user and only after
   * all the retires an error state should be shown
   */
  const resp = await fetch(`/api/messages?offset=${offset}&size=${size}`);
  const newMessages = await resp.json();

  return newMessages;
};
