import { Modal } from "react-bootstrap";

import { useEffect, useState } from "react";

function TicketConfirmation(props) {
    const {
        show,
        onClose,
        ticket,
        service,
        estimatedWaitingMinutes
    } = props;

    // State of the ticket confirmation countdown.
    const [secondsLeft, setSecondsLeft] = useState(20);

    // Start the countdown when the modal is shown.
    useEffect(() => {
        if (!show) {
            return;
        }

        setSecondsLeft(20);

        const intervalId = setInterval(() => {
            setSecondsLeft((seconds) => Math.max(0, seconds - 1));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [show]);

    // Close the modal when the countdown reaches zero.
    useEffect(() => {
        if (show && secondsLeft === 0) {
            onClose();
        }
    }, [show, secondsLeft, onClose]);

    if (!ticket || !service) {
        return null;
    }

    const issuedAt = ticket.createdAt
        ? new Date(ticket.createdAt)
        : null;

    const validIssuedAt = issuedAt &&
        !Number.isNaN(issuedAt.getTime());

    const hasWaitingEstimate =
        Number.isFinite(estimatedWaitingMinutes) &&
        estimatedWaitingMinutes >= 0;

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            aria-labelledby="ticket-confirmation-title"
        >
            <Modal.Header closeButton>
                <Modal.Title id="ticket-confirmation-title">
                    Your ticket
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="ticket-modal-body p-4">
                <div className="ticket-confirmation text-center p-4">
                    <p className="ticket-brand text-uppercase mb-2">
                        Office Queue Management
                    </p>

                    <h2 className="h5 ticket-service mb-3">
                        {service.name}
                    </h2>

                    <p className="ticket-description mb-1">
                        Your queue code
                    </p>

                    <p className="ticket-code mb-4">
                        {ticket.code}
                    </p>

                    <div className="ticket-details pt-3">

                        {hasWaitingEstimate && (
                            <div className="mb-3">
                                <p className="ticket-description mb-1">
                                    Estimated waiting time
                                </p>

                                <p className="fw-bold mb-0">
                                    Approximately{" "}
                                    {Math.ceil(estimatedWaitingMinutes)} min
                                </p>
                            </div>
                        )}

                        <p className="ticket-description mb-0">
                            Note your ticket code 
                            and wait for it to appear 
                            on the display.
                        </p>

                        <p className="text-danger small mt-3 mb-0">
                            This screen will disappear in {secondsLeft} seconds. Note your ticket code before then.
                        </p>

                        {validIssuedAt && (
                            <p className="ticket-issued mt-3 mb-0">
                                Issued on{" "}
                                <time dateTime={issuedAt.toISOString()}>
                                    {issuedAt.toLocaleString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    })}
                                </time>
                            </p>
                        )}

                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}

export default TicketConfirmation;