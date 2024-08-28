const URL = "https://telegram-logger.tamayotchi26.workers.dev";

export const sendInfoLog = async (message: string, params: Object) => {
  return fetch(`${URL}/log/info`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      extra: params,
    }),
  });
};

export const sendErrorLog = async (message: string, stack: string) => {
  return fetch(`${URL}/log/error`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      stack,
    }),
  });
};
