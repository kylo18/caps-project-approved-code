import React from "react";

const Credits = () => {
  const developers = [
    {
      name: "Darjay Roy S. Ebao",
      course: "BSCPE 2",
      role: "Project Manager",
      description:
        "Responsible for project scheduling, feature prioritization, and team coordination to deliver a responsive, role-based web application.",
      image: "/ebao.jpg",
      social: {
        facebook: "https://www.facebook.com/YezzDarj",
        github: "#",
        linkedin: "#",
      },
    },
    {
      name: "Vincent Carl G. Tan",
      role: "Frontend Developer",
      course: "BSCPE 2",
      description:
        "Tasked with crafting responsive user interfaces, implementing dynamic interactions, and ensuring a smooth and consistent user experience across all devices.",
      image: "/tan.jpg",
      social: {
        facebook: "https://www.facebook.com/vincent.tan.412338",
        github: "#",
        linkedin: "#",
      },
    },
    {
      name: "Kent P. Apat",
      role: "Backend Developer",
      course: "BSCPE 2",

      description:
        "Responsible for developing and maintaining server-side logic, managing database interactions, and ensuring secure and efficient data flow across the system.",
      image: "/apat.jpg",
      social: {
        facebook: "https://www.facebook.com/kent.toyex",
        github: "#",
        linkedin: "#",
      },
    },
    {
      name: "Carlos Miguel S. Sabijon",
      role: "QA Tester, Documentation and Deployment Specialist",
      course: "BSCPE 2",

      description:
        "Tasked with verifying functionality, identifying UI/UX issues, and ensuring a consistent experience across devices and browsers.",
      image: "/sabs.png",
      social: {
        facebook: "https://www.facebook.com/carlos.sabijon",
        github: "#",
        linkedin: "#",
      },
    },
  ];

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-12 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/bg.jpg')",
        backgroundSize: "200%",
        backgroundPosition: "center",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Meet the Team
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-gray-700">
            The talented developers behind this project who worked tirelessly to
            bring this vision to life.
          </p>
        </div>

        {/* Developers Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {developers.map((dev, index) => (
            <a
              key={index}
              href={dev.social.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="transform cursor-pointer overflow-hidden rounded-xl bg-white shadow-lg transition duration-300 hover:scale-105"
            >
              {/* Developer Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={dev.image}
                  alt={dev.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Developer Info */}
              <div className="p-6">
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  {dev.name}
                </h3>
                <p className="mb-3 font-medium text-orange-500">{dev.role}</p>
                <p className="mb-4 text-gray-600">{dev.description}</p>
                <p className="mt-8 text-[14px] text-gray-500">{dev.course}</p>
              </div>
            </a>
          ))}
        </div>

        {/* Footer Section */}
        <div className="mt-16 text-center">
          <p className="text-gray-700">Built with ❤️ by the development team</p>
          <p className="mt-2 text-sm text-gray-600">
            © {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </div>
    </div>
  );
};

export default Credits;
