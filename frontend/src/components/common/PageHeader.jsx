function PageHeader(props) {
    const {
        className = "",
        kicker,
        title,
        description
    } = props;

    return (
        <header className={className}>
            {kicker && (
                <p className="text-uppercase">
                    {kicker}
                </p>
            )}

            {title && (
                <h1 className="text-uppercase">
                    {title}
                </h1>
            )}

            {description && (
                <p>
                    {description}
                </p>
            )}
        </header>
    );
}

export default PageHeader;