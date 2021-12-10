const token = process.env.NEXT_PUBLIC_TEAMTAILOR_API_TOKEN;

const fetchService = async (url, opts: RequestInit = {}) => {
  let headers = new Headers(opts.headers || {});
  headers.set("Authorization", `Token token=${token}`);
  headers.set("X-Api-Version", "20210218");

  const endpoint = `https://api.teamtailor.com/v1${url}`;

  const res = await fetch(endpoint, {
    ...opts,
    headers,
  });
  if (res.status === 204) {
    return [res];
  }

  const body = await res.json();

  if (!Array.isArray(body.errors) && typeof body.error === "string") {
    body.errors = [body.error];
  }
  return [res, body];
};

export const getJobs = async (all = true) => {
  const q = all ? "?page[size]=30" : "";
  const [res, body] = await fetchService(`/jobs${q}`, {
    method: "GET",
  });

  if (res.status !== 200) {
    throw new Error(body);
  }

  const jobs = body.data.map((job, index) => {
    return {
      id: job.id,
      title: job.attributes.title,
      slug: `${job.id}-${job.attributes.title}`
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .toLowerCase(),
    };
  });

  return jobs;
};

export const getJobById = async (id) => {
  const [res, body] = await fetchService(`/jobs/${id}`, {
    method: "GET",
  });

  if (res.status !== 200) {
    throw new Error(body);
  }

  return body.data;
};
