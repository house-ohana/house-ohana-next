type Step = {
  title: string;
  description?: string;
};

type Props = {
  steps: Step[];
};

export default function StepList({ steps }: Props) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-4 rounded-2xl bg-ohana-white p-5">
          <span
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-ohana-green text-base font-bold text-ohana-white"
            aria-hidden="true"
          >
            {index + 1}
          </span>
          <div className="flex flex-col gap-1 pt-0.5">
            <p className="text-base font-bold text-ohana-ink sm:text-lg">{step.title}</p>
            {step.description ? (
              <p className="text-base leading-loose text-ohana-gray">{step.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
