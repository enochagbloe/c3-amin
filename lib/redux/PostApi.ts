// // create an api
// import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// export const PostApi = createApi({
//     reducerPath: 'api',
//     baseQuery: fetchBaseQuery({
//         baseUrl: 'http://localhost:3000/api',
//     }),
//     endpoints(build: any) {
//         return {
//             getPosts:build.query({
//                 query: () => '/users',
//             })
//         }
//     },
// })

// export const { useGetPostsQuery } = PostApi;
