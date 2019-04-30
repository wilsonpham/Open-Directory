
class ChangeLog extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isExpanded: false,
        };
    }


    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
        });
    }

    render() {

        const sorted = this.props.items.sort(function(a, b) {
            return (b.height===null)-(a.height===null) || +(b.height>a.height) || -(b.height<a.height);
        });

        var idx = 0;

        return (
            <div id="changelog">
                <h3>Changelog</h3>
                <table>
                    <tbody>
                    {sorted.map(i => {
                        if ((idx++ <= 5) || this.state.isExpanded) {
                            return <ChangeLogItem item={i} key={"changelog-" + i.txid} onSuccessHandler={this.props.onSuccessHandler} onErrorHandler={this.props.onErrorHandler} />;
                        }
                    })}
                    </tbody>
                    {(!this.state.isExpanded && this.props.items.length > 5) && <tbody><tr>
                        <td colSpan="3" className="expand"><a onClick={this.handleToggleExpand.bind(this)}>Show all {this.props.items.length} changes from Changelog</a></td>
                     </tr></tbody>}
                </table>
            </div>
        )
    }

    
}

class ChangeLogItem extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            isShowingWarning: false,
            isExpanded: false,
        };
    }

    clearForm() {
        const el = document.getElementById("changelog-action-" + this.props.item.txid).querySelector(".undo-money-button");
        if (el) {
            const parentNode = el.parentNode;
            parentNode.removeChild(el);
            const newEl = document.createElement('div');
            newEl.className = "undo-money-button";
            parentNode.appendChild(newEl);
        }
    }



    handleUndo(e) {
        e.preventDefault();

        const OP_RETURN = [
            OPENDIR_PROTOCOL,
            "undo",
            this.props.item.txid,
        ];

        console.log(OP_RETURN);

        this.setState({"isShowingWarning": true}, () => {
            const el = document.getElementById("changelog-action-" + this.props.item.txid).querySelector(".undo-money-button");
            databutton.build({
                data: OP_RETURN,
                button: {
                    $el: el,
                    onPayment: (msg) => {
                        setTimeout(() => {
                            this.clearForm();
                            this.setState({"isShowingWarning": false, "isExpanded": false});
                            this.props.onSuccessHandler("Successfully reversed transaction, it will appear automatically—please refresh the page if it doesn't.");
                        }, 3000);
                    }
                }
            });
        });
    }

    handleToggleExpand(e) {
        this.setState({
            "isExpanded": !this.state.isExpanded,
            "isShowingWarning": false,
        });
    }

    render() {
        return (<React.Fragment>
                    <tr>
                        <td className="height">
                            <a onClick={this.handleToggleExpand.bind(this)} className="arrow">{this.state.isExpanded ? "▼" : "▶"}</a>
                            {this.props.item.height ? <span className="block">#{this.props.item.height}</span> : <span className="pending">pending</span>}
                        </td>
                        <td className="action">{this.props.item.data.s2}</td>
                        <td className="address">{this.props.item.address}</td>
                    </tr>
                    {this.state.isExpanded && <tr>
                        <td className="data" colSpan="3"><pre><code>{JSON.stringify(this.props.item.data, null, 4)}</code></pre></td>
                        </tr>}
                    {this.state.isExpanded && <tr>
                            <td className="undo" colSpan="3" id={"changelog-action-" + this.props.item.txid}>
                            <a href={"https://whatsonchain.com/tx/" + this.props.item.txid}>{this.props.item.txid}</a>&nbsp;
                        <a onClick={this.handleUndo.bind(this)}>undo</a>
                            {this.state.isShowingWarning && <div className="notice"><span className="warning">You are undoing this change, are you sure you want to do this?</span><div className="explain"><p>If you undo this change, you'll be permanently undoing it in this directory for everyone else. Please only do this if you think it's in the best interest of the directory. Your Bitcoin key is forever tied to this transaction, so it will always be traced to you.</p><p><strong>Permanently undo this change?</strong></p><div className="undo-money-button"></div> </div></div>}
                            </td>
                            </tr>}
                </React.Fragment>
        );
    }
}
