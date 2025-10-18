function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-900 py-12 text-gray-300">
      <div className="mx-auto max-w-7xl px-6 md:px-16">
        <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <h3 className="mb-4 text-2xl font-bold text-white">Convofy</h3>
            <p className="max-w-md text-gray-400">
              The modern way to stay connected. Experience real-time messaging
              that brings people together.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Product</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#features"
                  className="transition-colors hover:text-white"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#howitworks"
                  className="transition-colors hover:text-white"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a href="#qa" className="transition-colors hover:text-white">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold text-white">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Privacy
                </a>
              </li>
              <li>
                <a href="#" className="transition-colors hover:text-white">
                  Terms
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8 text-center">
          <p className="text-gray-400">
            © {new Date().getFullYear()} Convofy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
