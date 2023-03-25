
export function createPaginationInfo(page, limit, count) {
  return {
    "page": page,
    "limit": limit,
    "totalCount": count,
    "totalPages": Math.ceil(count / limit),
  };
};