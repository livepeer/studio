const token = process.env.TEAMTAILOR_API_TOKEN;

type Candidate = {
  "first-name": string;
  "last-name": string;
  email: string;
  phone: string;
  resume: string;
};

type JobApplication = {
  candidateId: string;
  jobId: string;
  "cover-letter": string;
};

type Answer = {
  questionId: string;
  questionType: string;
  value: string | string[];
  candidateId: string;
};

const fetchService = async (url, opts: RequestInit = {}) => {
  let headers = new Headers(opts.headers || {});
  headers.set("Authorization", `Token token=${token}`);
  headers.set("X-Api-Version", "20210218");
  headers.set("Content-Type", "application/vnd.api+json");

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
    throw new Error(body.errors[0].title);
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
    throw new Error(body.errors[0].title);
  }

  return body.data;
};

export const getQuestionIdsByJobId = async (id) => {
  const [res, body] = await fetchService(
    `/jobs/${id}/relationships/questions`,
    {
      method: "GET",
    }
  );

  if (res.status !== 200) {
    throw new Error(body.errors[0].title);
  }

  return body.data;
};

export const getQuestionsById = async (id) => {
  const [res, body] = await fetchService(`/questions/${id}`, {
    method: "GET",
  });

  if (res.status !== 200) {
    throw new Error(body.errors[0].title);
  }

  return body.data;
};

export const createCandidate = async (data: Candidate) => {
  const [res, body] = await fetchService(`/candidates`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "candidates",
        attributes: {
          merge: true,
          ...data,
        },
      },
    }),
  });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(body.errors[0].title);
  }

  return body.data;
};

export const createJobApplication = async (data: JobApplication) => {
  const [res, body] = await fetchService(`/job-applications`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "job-applications",
        attributes: {
          "cover-letter": data["cover-letter"],
          sourced: true,
          "send-user-notifications": true,
        },
        relationships: {
          candidate: {
            data: {
              id: data.candidateId,
              type: "candidates",
            },
          },
          job: {
            data: {
              id: data.jobId,
              type: "jobs",
            },
          },
        },
      },
    }),
  });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(body.errors[0].title);
  }

  return body.data;
};

export const createAnswer = async (data: Answer) => {
  const [res, body] = await fetchService(`/answers`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "answers",
        attributes: {
          [data.questionType]: data.value,
        },
        relationships: {
          candidate: {
            data: {
              id: data.candidateId,
              type: "candidates",
            },
          },
          question: {
            data: {
              id: data.questionId,
              type: "questions",
            },
          },
        },
      },
    }),
  });

  if (res.status !== 200 && res.status !== 201) {
    throw new Error(body.errors[0].title);
  }

  return body.data;
};
