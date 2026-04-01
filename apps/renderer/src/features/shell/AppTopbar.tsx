type AppTopbarProps = {
  title: string;
  subtitle: string;
};

export const AppTopbar = ({ title, subtitle }: AppTopbarProps) => {
  return (
    <header className="app-topbar panel-fade-in">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
    </header>
  );
};
