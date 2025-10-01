# TODO: Add Search Bar with Debouncing to API Rooms

- [x] Fix the API endpoint in app/api/rooms/route.ts to correctly read the query parameter from the request URL instead of window.location.search.
- [x] Update the useGetRooms hook in hooks/use-rooms.ts to accept a search query parameter and pass it to the API request.
- [x] Update the chat page in app/(views)/chat/page.tsx to use the debounced search query to fetch filtered rooms from the API instead of filtering locally.
