interface PersonUnavailableProps {
  isYouUnavailable: boolean;
}

function PersonUnavailable({ isYouUnavailable }: PersonUnavailableProps) {
  return (
    <div className="border-t bg-linear-to-r from-gray-50 to-gray-100 px-6 py-8 shadow-lg">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-4 inline-flex items-center justify-center rounded-full bg-gray-200 p-3">
          <svg
            className="h-8 w-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-semibold text-gray-800">
          {isYouUnavailable ? "You are" : "This person is"} unavailable
        </h3>
        <p className="text-sm text-gray-600">
          {isYouUnavailable
            ? "You are dead to receive messages. Turn on your presence to receive messages."
            : " This person is currently not available to receive messages. Please try again later."}
        </p>
      </div>
    </div>
  );
}

export default PersonUnavailable;
