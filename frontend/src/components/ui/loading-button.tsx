import { Button, ButtonProps } from "@/components/ui/button"
import { Spinner } from "./spinner"

type LoadingButtonProps = ButtonProps & {
  loading?: boolean
}

export function LoadingButton({ loading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={loading || props.disabled} {...props}>
      {loading && (
        <Spinner data-icon="inline-start" />
      )}
      {children}
    </Button>
  )
}

