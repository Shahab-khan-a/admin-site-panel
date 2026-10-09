export const metadata = {
  title: 'Ajeer HRS permit',
  description: 'Ajeer Human Resources Solutions Permit Verification',
};

export default function NoticesLayout({ children }) {
  return (
    <>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      {children}
    </>
  );
}
